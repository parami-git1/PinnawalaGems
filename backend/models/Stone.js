const mongoose = require('mongoose');

const stoneSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'GemCategory', required: true },
  stoneId: { type: String }, // අර කලින් හදපු ID එක
  title: { type: String, required: true }, // අනිවාර්යයි
  image: { type: String, required: true }, // අනිවාර්යයි
  quantity: { type: Number, default: 1 },  // නොදුන්නොත් 1යි
  description: { type: String, required: false }, // Optional
  weight: { type: String, required: false }, // 🔹 String කළා (එතකොට '5.2 ct' වගේ සේව් කරන්න ලේසියි)
  color: { type: String, required: false },  // Optional
  shape: { type: String, required: false },  // Optional
  cut: { type: String, default: '' },        // 🔹 අලුතින් එකතු කළ Cut එක
  price: { type: Number, required: false },  // Optional
  hasCertificate: { type: Boolean, default: false },
  certificateDetails: { type: String, required: false },
  certificateImage: { type: String, required: false },
  isFeatured: { type: Boolean, default: false },
  origin: { type: String, default: '' },
  additionalImages: [{ type: String }],      // පින්තූර 5ක් දාන්න
  
  // 🔹 අලුත් Top 10 Gems වලට අදාළ කෑලි 2 🔹
  isTopGem: { type: Boolean, default: false },
  homePagePosition: { type: Number, default: 0 }
  
}, { timestamps: true });

module.exports = mongoose.model('Stone', stoneSchema);