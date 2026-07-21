const mongoose = require('mongoose');

const eventAdSchema = new mongoose.Schema({
  title: { type: String, required: true },          // Event / Advertisement Name
  image: { type: String, required: true },          // Uploaded Image URL
  layoutType: { type: String, enum: ['horizontal', 'vertical'], default: 'horizontal' }, // Horizontal ද Vertical ද කියලා
  description: { type: String, default: '' },       // Optional Description
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventAd', eventAdSchema);