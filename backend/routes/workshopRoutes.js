const express = require('express');
const WorkshopStep = require('../models/WorkshopStep');
const requireAdmin = require('../middleware/adminAuth');
const { objectId, routeError } = require('../utils/catalogData');
const { publicWorkshopQuery, workshopPayload } = require('../utils/workshopContent');
const router = express.Router();

// Read-time visibility needs no cron process and survives service restarts.
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/admin', requireAdmin, async (_req, res) => {
  try { res.json(await WorkshopStep.find({}).sort({ createdAt: -1, _id: -1 })); }
  catch (error) { routeError(res, error); }
});
router.get('/', async (_req, res) => {
  try { res.json(await WorkshopStep.find(publicWorkshopQuery()).sort({ createdAt: -1, _id: -1 })); }
  catch (error) { routeError(res, error); }
});
router.post('/', requireAdmin, async (req, res) => {
  try {
    const post = new WorkshopStep(workshopPayload(req.body));
    await post.save(); res.status(201).json(post);
  } catch (error) { routeError(res, error); }
});
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = objectId(req.params.id, 'Workshop post');
    const previous = await WorkshopStep.findById(id);
    if (!previous) return res.status(404).json({ message: 'Workshop post not found' });
    const payload = workshopPayload(req.body, previous);
    const post = await WorkshopStep.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ message: 'Workshop post not found' });
    res.json(post);
  } catch (error) { routeError(res, error); }
});
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const post = await WorkshopStep.findByIdAndDelete(objectId(req.params.id, 'Workshop post'));
    if (!post) return res.status(404).json({ message: 'Workshop post not found' });
    res.json({ message: 'Workshop post deleted successfully' });
  } catch (error) { routeError(res, error); }
});
module.exports = router;
