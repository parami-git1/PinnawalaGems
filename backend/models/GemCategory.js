const mongoose = require('mongoose');

const gemCategorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  mainImage: { type: String, required: true },
  coverImage: { type: String, default: '' } // 🔹 මේ පේළිය අලුතින් එකතු කරන්න
}, { timestamps: true });

module.exports = mongoose.model('GemCategory', gemCategorySchema);