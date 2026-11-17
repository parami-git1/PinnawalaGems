const mongoose = require('mongoose');
const stockStoneSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockCategory', required: true },
  stoneId: { type: String, immutable: true }, title: { type: String, required: true, trim: true, maxlength: 200 }, image: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0, validate: Number.isInteger }, description: { type: String, maxlength: 10000 }, weight: { type: Number, min: 0 },
  color: { type: String, trim: true }, shape: { type: String, trim: true }, price: { type: Number, min: 0 },
  hasCertificate: { type: Boolean, default: false }, certificateImage: { type: String },
}, { timestamps: true });
module.exports = mongoose.model('StockStone', stockStoneSchema);
