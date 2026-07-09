const express = require('express');
const router = express.Router();
const WorkshopStep = require('../models/WorkshopStep');

// Get all workshop steps
router.get('/', async (req, res) => {
  try {
    // 1 වෙනුවට -1 දැම්මාම අලුත්ම ඒවා (newest) උඩටම එනවා
    const steps = await WorkshopStep.find().sort({ createdAt: -1 }); 
    res.json(steps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new workshop step (Admin only)
router.post('/', async (req, res) => {
  const { title, description, imageUrl } = req.body;
  const newStep = new WorkshopStep({ title, description, imageUrl });
  try {
    const savedStep = await newStep.save();
    res.status(201).json(savedStep);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a workshop step (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    await WorkshopStep.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workshop step deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;