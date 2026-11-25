const mongoose = require('mongoose');
const { validPlannerColor, validPlannerDay } = require('../utils/plannerFields');

const adminNoteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['General', 'Customer', 'Gem', 'Follow-up', 'Task'], default: 'General' },
  tags: { type: [String], default: [] },
  color: { type: String, default: 'slate', validate: { validator: (value) => validPlannerColor(value, true), message: 'Choose a valid note color in #RRGGBB format or an existing palette color.' } },
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  reminderAt: { type: Date, default: null },
  noteDate: { type: String, default: '', validate: { validator: validPlannerDay, message: 'Choose a valid calendar date in YYYY-MM-DD format.' } },
  customerName: { type: String, default: '' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null }
}, { timestamps: true });

adminNoteSchema.index({ title: 'text', content: 'text', tags: 'text', customerName: 'text' });

module.exports = mongoose.model('AdminNote', adminNoteSchema);
