const express = require('express');
const Gem = require('../models/Gem');
const requireAdmin = require('../middleware/adminAuth');
const { pick, string, url, carats, invalid, objectId, routeError } = require('../utils/catalogData');
const router = express.Router();
function payload(body) {
  const result = pick(body, ['title','description','category','primaryColor','mainImage','variations']);
  for (const key of ['title','description','category','primaryColor']) if (key in result) result[key] = string(result[key], key, { required: true, max: key === 'description' ? 10000 : 200 });
  if ('mainImage' in result) result.mainImage = url(result.mainImage, 'Main image');
  if ('variations' in result) {
    if (!Array.isArray(result.variations) || result.variations.length > 30) throw invalid('Use up to 30 variations.');
    result.variations = result.variations.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw invalid('Each variation must contain its weight and image URLs.');
      const weight = carats(item.weight); if (weight == null) throw invalid('Each variation requires a weight.');
      if (!Array.isArray(item.images) || item.images.length > 10) throw invalid('Each variation supports up to 10 image URLs.');
      return { weight: String(item.weight).trim(), designName: string(item.designName || '', 'Design name', { max: 200 }), images: [...new Set(item.images.map((image) => url(image, 'Variation image')))] };
    });
  }
  return result;
}
router.post('/', requireAdmin, async (req, res) => { try { const gem = new Gem(payload(req.body)); await gem.save(); res.status(201).json(gem); } catch (error) { routeError(res, error); } });
router.get('/', async (_req, res) => { try { res.json(await Gem.find().sort({ createdAt: -1, _id: -1 })); } catch (error) { routeError(res, error); } });
router.get('/:id', async (req, res) => { try { const gem = await Gem.findById(objectId(req.params.id)); if (!gem) return res.status(404).json({ message: 'Gem not found' }); res.json(gem); } catch (error) { routeError(res, error); } });
router.put('/:id', requireAdmin, async (req, res) => { try { const gem = await Gem.findByIdAndUpdate(objectId(req.params.id), { $set: payload(req.body) }, { new: true, runValidators: true }); if (!gem) return res.status(404).json({ message: 'Gem not found' }); res.json(gem); } catch (error) { routeError(res, error); } });
router.delete('/:id', requireAdmin, async (req, res) => { try { if (!await Gem.findByIdAndDelete(objectId(req.params.id))) return res.status(404).json({ message: 'Gem not found' }); res.json({ message: 'Gem deleted.' }); } catch (error) { routeError(res, error); } });
module.exports = router;
