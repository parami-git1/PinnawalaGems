const mongoose = require('mongoose');
const { STOCK_STATUSES, STOCK_TREATMENTS } = require('../utils/catalogData');
const stockStoneSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockCategory', required: true },
  stoneId: { type: String, immutable: true }, title: { type: String, required: true, trim: true, maxlength: 200 }, image: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0, validate: Number.isInteger }, description: { type: String, maxlength: 10000 }, weight: { type: Number, min: 0 },
  color: { type: String, trim: true }, shape: { type: String, trim: true }, price: { type: Number, min: 0 },
  includedInStock: { type: Boolean, default: true },
  archivedAt: { type: Date, default: null },
  archivedReason: { type: String, default: '', enum: ['', 'sold'] },
  archiveBatchId: { type: String, default: '' },
  stockStatus: { type: String, enum: STOCK_STATUSES, default: 'Available' },
  treatment: { type: String, enum: STOCK_TREATMENTS, default: 'Unspecified' },
  cut: { type: String, default: '', trim: true, maxlength: 200 },
  origin: { type: String, default: '', trim: true, maxlength: 200 },
  hasCertificate: { type: Boolean, default: false }, certificateImage: { type: String }, certificateDetails: { type: String, maxlength: 10000 },
}, { timestamps: true });
module.exports = mongoose.model('StockStone', stockStoneSchema);
