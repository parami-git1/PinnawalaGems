const express = require('express');
const EventAd = require('../models/EventAd');
const requireAdmin = require('../middleware/adminAuth');
const { pick, string, url, invalid, objectId, routeError } = require('../utils/catalogData');
const router = express.Router();
function payload(body) {
  const result = pick(body, ['title','image','layoutType','description']);
  if ('title' in result) result.title = string(result.title, 'Title', { required: true, max: 200 });
  if ('description' in result) result.description = string(result.description, 'Description', { max: 10000 });
  if ('image' in result) result.image = url(result.image, 'Image');
  if ('layoutType' in result && !['horizontal','vertical'].includes(result.layoutType)) throw invalid('Choose horizontal or vertical layout.');
  return result;
}
router.get('/', async (_req, res) => { try { res.json(await EventAd.find().sort({ createdAt: -1, _id: -1 })); } catch (error) { routeError(res, error); } });
router.post('/', requireAdmin, async (req, res) => { try { const ad = new EventAd(payload(req.body)); await ad.save(); res.status(201).json(ad); } catch (error) { routeError(res, error); } });
router.put('/:id', requireAdmin, async (req, res) => {
  try { const ad = await EventAd.findByIdAndUpdate(objectId(req.params.id), { $set: payload(req.body) }, { new: true, runValidators: true }); if (!ad) return res.status(404).json({ message: 'Ad not found' }); res.json(ad); } catch (error) { routeError(res, error); }
});
router.delete('/:id', requireAdmin, async (req, res) => {
  try { const ad = await EventAd.findById(objectId(req.params.id)); if (!ad) return res.status(404).json({ message: 'Ad not found' }); await EventAd.findByIdAndDelete(req.params.id); res.json({ message: 'Event/Ad deleted. Uploaded media retained.', mediaRetained: true }); } catch (error) { routeError(res, error); }
});
module.exports = router;
