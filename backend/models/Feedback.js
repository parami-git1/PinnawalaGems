const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  review: { type: String, required: true, trim: true, minlength: 3, maxlength: 4000 },
  rating: { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger, message: 'Choose a whole-number rating from 1 to 5.' } },
  // අලුතින් එකතු කරපු field එක (මුලින්ම approve වෙලා නැහැ)
  isApproved: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
