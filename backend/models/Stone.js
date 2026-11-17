const mongoose = require('mongoose');
const { carats } = require('../utils/catalogData');
const stoneSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'GemCategory', required: true },
  stoneId: { type: String, immutable: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  image: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0, validate: Number.isInteger },
  description: { type: String, maxlength: 10000 },
  weight: { type: String, default: '' },
  caratWeight: { type: Number, min: 0, default: null },
  color: { type: String, trim: true }, shape: { type: String, trim: true }, cut: { type: String, default: '', trim: true },
  price: { type: Number, min: 0 }, hasCertificate: { type: Boolean, default: false },
  certificateDetails: { type: String, maxlength: 10000 }, certificateImage: { type: String }, isFeatured: { type: Boolean, default: false },
  origin: { type: String, default: '', trim: true }, additionalImages: [{ type: String }], videos: { type: [String], default: [] },
  isTopGem: { type: Boolean, default: false }, homePagePosition: { type: Number, default: 0, min: 0, validate: Number.isInteger },
}, { timestamps: true });
stoneSchema.pre('validate', function normalizeCarats() { if (this.isModified('weight')) this.caratWeight = carats(this.weight); });
// Generated references derive from unique ObjectIds; legacy references are not rewritten.
module.exports = mongoose.model('Stone', stoneSchema);
