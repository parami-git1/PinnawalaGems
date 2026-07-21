const express = require('express');
const router = express.Router();
const EventAd = require('../models/EventAd');
const cloudinary = require('cloudinary').v2;

// සියලුම Events/Ads ලබා ගැනීම
router.get('/', async (req, res) => {
  try {
    const ads = await EventAd.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// අලුත් Event/Ad එකක් එකතු කිරීම
router.post('/', async (req, res) => {
  try {
    const { title, image, layoutType, description } = req.body;
    const newAd = new EventAd({ title, image, layoutType, description });
    await newAd.save();
    res.status(201).json(newAd);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Event/Ad එකක් මකා දැමීම
router.delete('/:id', async (req, res) => {
  try {
    const ad = await EventAd.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    // Cloudinary එකෙන් ඉවත් කිරීම (ತಿබේ නම්)
    if (ad.image && ad.image.includes('cloudinary')) {
      const publicId = ad.image.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await EventAd.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event/Ad deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;