const express = require('express');
const mongoose = require('mongoose');
const GemCategory = require('../models/GemCategory');
const Stone = require('../models/Stone');
const requireAdmin = require('../middleware/adminAuth');
const { normalizeGemMedia } = require('../utils/gemMedia');
const { stonePayload, categoryPayload, generatedReference, objectId, routeError, catalogPage } = require('../utils/catalogData');
const { deleteAssets, deleteStoneAssets } = require('../utils/assetCleanup');
const router = express.Router();
router.get('/categories', async (_req, res) => {
  try { res.json(await GemCategory.find().sort({ createdAt: -1, _id: -1 })); } catch (error) { routeError(res, error); }
});
router.post('/categories', requireAdmin, async (req, res) => {
  try { const category = new GemCategory(categoryPayload(req.body)); await category.save(); res.status(201).json(category); } catch (error) { routeError(res, error); }
});
router.get('/categories/:categoryId/stones', async (req, res) => {
  try { res.json(await catalogPage(Stone, req.query, req.params.categoryId)); } catch (error) { routeError(res, error); }
});
router.get('/stones', async (req, res) => {
  try { res.json(await catalogPage(Stone, req.query)); } catch (error) { routeError(res, error); }
});
router.post('/stones', requireAdmin, async (req, res) => {
  try {
    const payload = { ...stonePayload(req.body), ...normalizeGemMedia(req.body) };
    const category = await GemCategory.findById(payload.categoryId);
    if (!category) return res.status(400).json({ message: 'Choose an existing gemstone category.' });
    const id = new mongoose.Types.ObjectId();
    const stone = new Stone({ ...payload, _id: id, quantity: payload.quantity ?? 1, stoneId: generatedReference(category, id) });
    await stone.save(); res.status(201).json(stone);
  } catch (error) { routeError(res, error); }
});
router.get('/stones/:stoneId', async (req, res) => {
  try { const stone = await Stone.findById(objectId(req.params.stoneId)); if (!stone) return res.status(404).json({ message: 'Stone not found' }); res.json(stone); } catch (error) { routeError(res, error); }
});
router.put('/stones/:stoneId/feature', requireAdmin, async (req, res) => {
  try {
    const current = await Stone.findById(objectId(req.params.stoneId));
    if (!current) return res.status(404).json({ message: 'Stone not found' });
    res.json(await Stone.findByIdAndUpdate(req.params.stoneId, { $set: { isFeatured: !current.isFeatured } }, { new: true, runValidators: true }));
  } catch (error) { routeError(res, error); }
});
router.put('/stones/:stoneId', requireAdmin, async (req, res) => {
  try {
    const current = await Stone.findById(objectId(req.params.stoneId));
    if (!current) return res.status(404).json({ message: 'Stone not found' });
    const payload = { ...stonePayload(req.body, { existing: current }), ...normalizeGemMedia(req.body, current) };
    if (payload.categoryId && !await GemCategory.findById(payload.categoryId)) return res.status(400).json({ message: 'Choose an existing gemstone category.' });
    res.json(await Stone.findByIdAndUpdate(req.params.stoneId, { $set: payload }, { new: true, runValidators: true }));
  } catch (error) { routeError(res, error); }
});
router.delete('/stones/:stoneId', requireAdmin, async (req, res) => {
  try {
    const stone = await Stone.findById(objectId(req.params.stoneId)); if (!stone) return res.status(404).json({ message: 'Stone not found' });
    await deleteStoneAssets(stone); await Stone.findByIdAndDelete(req.params.stoneId); res.json({ message: 'Stone and its uploaded media deleted.' });
  } catch (error) { routeError(res, error); }
});
router.put('/categories/:categoryId', requireAdmin, async (req, res) => {
  try {
    const category = await GemCategory.findByIdAndUpdate(objectId(req.params.categoryId), { $set: categoryPayload(req.body) }, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: 'Category not found' }); res.json(category);
  } catch (error) { routeError(res, error); }
});
router.delete('/categories/:categoryId/stones', requireAdmin, async (req, res) => {
  try {
    const categoryId = objectId(req.params.categoryId, 'Category');
    if (!await GemCategory.findById(categoryId)) return res.status(404).json({ message: 'Category not found' });
    for (const stone of await Stone.find({ categoryId })) await deleteStoneAssets(stone);
    await Stone.deleteMany({ categoryId }); res.json({ message: 'All stones in this category deleted.' });
  } catch (error) { routeError(res, error); }
});
router.delete('/categories/:categoryId', requireAdmin, async (req, res) => {
  try {
    const categoryId = objectId(req.params.categoryId, 'Category'); const category = await GemCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await deleteAssets([category.mainImage, category.coverImage]);
    for (const stone of await Stone.find({ categoryId })) await deleteStoneAssets(stone);
    await Stone.deleteMany({ categoryId }); await GemCategory.findByIdAndDelete(categoryId); res.json({ message: 'Category and its stones deleted.' });
  } catch (error) { routeError(res, error); }
});
router.get('/top-gems', async (_req, res) => {
  try { res.json(await Stone.find({ isTopGem: true }).sort({ homePagePosition: 1, _id: 1 }).limit(10)); } catch (error) { routeError(res, error); }
});
module.exports = router;
