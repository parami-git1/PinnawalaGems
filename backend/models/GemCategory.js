const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Pink Sapphire"
  description: { type: String, required: false },
  mainImage: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GemCategory', categorySchema);