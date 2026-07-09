const mongoose = require('mongoose');

const stockStoneSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockCategory', required: true },
  stoneId: { type: String }, 
  title: { type: String, required: true }, 
  image: { type: String, required: true }, 
  quantity: { type: Number, default: 1 },  
  description: { type: String }, 
  weight: { type: Number }, 
  color: { type: String },  
  shape: { type: String },  
  price: { type: Number },  
  hasCertificate: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('StockStone', stockStoneSchema);