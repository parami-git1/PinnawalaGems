const express = require('express');
const mongoose = require('mongoose');
const StockCategory = require('../models/StockCategory');
const StockStone = require('../models/StockStone');
const requireAdmin = require('../middleware/adminAuth');
const { stonePayload, categoryPayload, generatedReference, objectId, routeError, pagination, catalogMatch } = require('../utils/catalogData');
const { deleteAssets, deleteStoneAssets } = require('../utils/assetCleanup');
const router = express.Router();
// Stock belongs to the administrative workspace, including read endpoints.
router.use(requireAdmin);
router.get('/categories', async (_req, res) => { try { res.json(await StockCategory.find().sort({ createdAt: -1, _id: -1 })); } catch (error) { routeError(res, error); } });
router.post('/categories', async (req, res) => { try { const category = new StockCategory(categoryPayload(req.body)); await category.save(); res.status(201).json(category); } catch (error) { routeError(res, error); } });
async function list(req, res) {
  try {
    const { page, limit } = pagination(req.query, 50); const match = catalogMatch(req.query, req.params.categoryId, { stock: true });
    if (req.query.includeArchived != null && !['true', 'false'].includes(req.query.includeArchived)) return res.status(400).json({ message: 'includeArchived must be true or false.' });
    if (req.query.includeArchived !== 'true') match.archivedAt = null;
    const stones = await StockStone.find(match).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).maxTimeMS(5000);
    const total = await StockStone.countDocuments(match).maxTimeMS(5000);
    res.json({ stones, total, totalPages: Math.ceil(total / limit), currentPage: page, limit });
  } catch (error) { routeError(res, error); }
}
router.get('/stones', list); router.get('/categories/:categoryId/stones', list);
router.post('/stones', async (req, res) => {
  try {
    const payload = stonePayload(req.body, { stock: true }); const category = await StockCategory.findById(payload.categoryId);
    if (!category) return res.status(400).json({ message: 'Choose an existing stock category.' });
    const id = new mongoose.Types.ObjectId(); const stone = new StockStone({ ...payload, _id: id, quantity: payload.quantity ?? 1, stoneId: generatedReference(category, id, true) });
    await stone.save(); res.status(201).json(stone);
  } catch (error) { routeError(res, error); }
});
router.put('/stones/:stoneId', async (req, res) => {
  try {
    const current = await StockStone.findById(objectId(req.params.stoneId)); if (!current) return res.status(404).json({ message: 'Stock stone not found' });
    const payload = stonePayload(req.body, { stock: true, existing: current });
    if (payload.categoryId && !await StockCategory.findById(payload.categoryId)) return res.status(400).json({ message: 'Choose an existing stock category.' });
    res.json(await StockStone.findByIdAndUpdate(req.params.stoneId, { $set: payload, $inc: { __v: 1 } }, { new: true, runValidators: true }));
  } catch (error) { routeError(res, error); }
});
router.delete('/stones/:stoneId', async (req, res) => {
  try {
    const stone = await StockStone.findById(objectId(req.params.stoneId)); if (!stone) return res.status(404).json({ message: 'Stock stone not found' });
    await deleteStoneAssets(stone); await StockStone.findByIdAndDelete(req.params.stoneId); res.json({ message: 'Stock stone and its uploaded images deleted.' });
  } catch (error) { routeError(res, error); }
});
router.delete('/categories/:categoryId', async (req, res) => {
  try {
    const categoryId = objectId(req.params.categoryId, 'Category'); const category = await StockCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Stock category not found' });
    await deleteAssets([category.mainImage]); for (const stone of await StockStone.find({ categoryId })) await deleteStoneAssets(stone);
    await StockStone.deleteMany({ categoryId }); await StockCategory.findByIdAndDelete(categoryId); res.json({ message: 'Stock category and its stones deleted.' });
  } catch (error) { routeError(res, error); }
});
module.exports = router;
