const mongoose = require('mongoose');

const gemCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, maxlength: 10000 },
  mainImage: { type: String, required: true },
  coverImage: { type: String, default: '' } // 🔹 මේ පේළිය අලුතින් එකතු කරන්න
}, { timestamps: true });

module.exports = mongoose.model('GemCategory', gemCategorySchema);
