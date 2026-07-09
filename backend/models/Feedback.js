const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  review: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  // අලුතින් එකතු කරපු field එක (මුලින්ම approve වෙලා නැහැ)
  isApproved: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);