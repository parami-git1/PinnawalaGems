const mongoose = require('mongoose');
const { validPlannerColor } = require('../utils/plannerFields');

const appointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  date: { type: Date, required: true },
  time: { type: String, required: true, trim: true },
  durationMinutes: { type: Number, default: 60, min: 15 },
  type: { type: String, enum: ['Viewing', 'Consultation', 'Purchase', 'Workshop', 'Other'], default: 'Viewing' },
  color: { type: String, default: '', validate: { validator: validPlannerColor, message: 'Choose a valid appointment color in #RRGGBB format.' } },
  status: { type: String, enum: ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'], default: 'Requested' },
  purpose: { type: String, default: '' },
  stoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stone', default: null },
  internalNotes: { type: String, default: '' }
}, { timestamps: true });

appointmentSchema.index({ date: 1, status: 1 });
appointmentSchema.index({ customerName: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Appointment', appointmentSchema);
