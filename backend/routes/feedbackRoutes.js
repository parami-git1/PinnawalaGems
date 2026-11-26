const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const requireAdmin = require('../middleware/adminAuth');
const { feedbackLimiter } = require('../middleware/security');
const mongoose = require('mongoose');
const { routeError } = require('../utils/catalogData');

// ඔක්කොම Feedbacks ගන්නවා (Frontend එකෙන් Admin ද නැද්ද කියලා බලලා ෆිල්ටර් කරනවා)
router.get('/', (req, res, next) => req.headers.authorization ? requireAdmin(req, res, next) : next(), async (req, res) => {
  try {
    const feedbacks = await Feedback.find(req.admin ? {} : { isApproved: true }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Reviews could not be loaded. Please try again.' });
  }
});

// අලුත් Feedback එකක් දානවා (isApproved default false)
router.post('/', feedbackLimiter, async (req, res) => {
  const { name, review, rating, website } = req.body || {};
  if (website || typeof name !== 'string' || typeof review !== 'string' || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Enter your name, review and a whole-number rating from 1 to 5.' });
  const trimmedName = name.trim();
  const trimmedReview = review.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100 || trimmedReview.length < 3 || trimmedReview.length > 4000) return res.status(400).json({ message: 'Use 2–100 characters for your name and 3–4,000 characters for your review.' });
  const newFeedback = new Feedback({ name: trimmedName, review: trimmedReview, rating });
  try {
    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    routeError(res, error);
  }
});

// Admin Review එක Approve කරන API එක
router.put('/:id/approve', requireAdmin, async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Choose a valid review.' });
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true, runValidators: true });
    if (!feedback) return res.status(404).json({ message: 'Review not found.' });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'The review could not be approved. Please try again.' });
  }
});

// Admin බොරු Review එකක් Delete කරන API එක
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Choose a valid review.' });
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Review not found.' });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'The review could not be deleted. Please try again.' });
  }
});

module.exports = router;
