const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// ඔක්කොම Feedbacks ගන්නවා (Frontend එකෙන් Admin ද නැද්ද කියලා බලලා ෆිල්ටර් කරනවා)
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// අලුත් Feedback එකක් දානවා (isApproved default false)
router.post('/', async (req, res) => {
  const { name, review, rating } = req.body;
  const newFeedback = new Feedback({ name, review, rating });
  try {
    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin Review එක Approve කරන API එක
router.put('/:id/approve', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin බොරු Review එකක් Delete කරන API එක
router.delete('/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;