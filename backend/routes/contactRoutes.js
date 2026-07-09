const express = require('express');
const router = express.Router();
const ContactData = require('../models/ContactData');

// Get Contact Details
router.get('/', async (req, res) => {
  try {
    let data = await ContactData.findOne();
    if (!data) {
      data = await ContactData.create({});
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Contact Details (Admin Only)
router.put('/', async (req, res) => {
  try {
    let data = await ContactData.findOne();
    if (!data) {
      data = new ContactData(req.body);
      await data.save();
    } else {
      data = await ContactData.findOneAndUpdate({}, req.body, { new: true });
    }
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;