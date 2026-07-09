const mongoose = require('mongoose');

const stockCategorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  mainImage: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('StockCategory', stockCategorySchema);