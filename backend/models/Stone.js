const mongoose = require('mongoose');

const stoneSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'GemCategory', required: true },
  stoneId: { type: String }, // අර කලින් හදපු ID එක
  title: { type: String, required: true }, // අනිවාර්යයි
  image: { type: String, required: true }, // අනිවාර්යයි
  quantity: { type: Number, default: 1 },  // 🔹 මේක තමයි අලුත් එක (නොදුන්නොත් 1යි)
  description: { type: String, required: false }, // Optional
  weight: { type: Number, required: false }, // Optional
  color: { type: String, required: false },  // Optional
  shape: { type: String, required: false },  // Optional
  price: { type: Number, required: false },  // Optional
  hasCertificate: { type: Boolean, default: false },
  certificateDetails: { type: String, required: false },
  certificateImage: { type: String, required: false },
  isFeatured: { type: Boolean, default: false },
  origin: { type: String, default: '' },
  additionalImages: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Stone', stoneSchema);