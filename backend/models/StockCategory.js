const mongoose = require('mongoose');

const stockCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, maxlength: 10000 },
  mainImage: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('StockCategory', stockCategorySchema);
