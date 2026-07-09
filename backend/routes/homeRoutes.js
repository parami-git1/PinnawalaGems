const express = require('express');
const router = express.Router();
const HomeData = require('../models/HomeData');

// 1. Home page details ganna API eka (Frontend ekata pennanna)
router.get('/', async (req, res) => {
  try {
    // Database eke thiyena mulma record eka gannawa
    let data = await HomeData.findOne(); 
    
    // Data nathnam, aluth ekak auto hadanawa (First time run weddi)
    if (!data) {
      data = await HomeData.create({});
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. Admin ta details update karanna API eka
router.put('/', async (req, res) => {
  try {
    // Database eke thiyena data update karanawa
    const updatedData = await HomeData.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(updatedData);
  } catch (err) {
    res.status(500).json({ message: "Error updating home data" });
  }
});

module.exports = router;