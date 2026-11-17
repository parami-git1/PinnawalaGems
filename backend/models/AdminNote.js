const mongoose = require('mongoose');

const adminNoteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['General', 'Customer', 'Gem', 'Follow-up', 'Task'], default: 'General' },
  tags: { type: [String], default: [] },
  color: { type: String, enum: ['slate', 'blue', 'amber', 'green', 'rose'], default: 'slate' },
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  reminderAt: { type: Date, default: null },
  customerName: { type: String, default: '' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null }
}, { timestamps: true });

adminNoteSchema.index({ title: 'text', content: 'text', tags: 'text', customerName: 'text' });

module.exports = mongoose.model('AdminNote', adminNoteSchema);
