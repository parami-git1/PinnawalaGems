const mongoose = require('mongoose');
const { validPlannerDay } = require('../utils/plannerFields');

const workshopStepSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 10000 },
  imageUrl: { type: String, required: true, maxlength: 2048 },
  publicationStatus: { type: String, required: true, enum: ['published', 'scheduled', 'draft'], default: 'published' },
  publishAt: { type: Date, default: null, validate: { validator(value) { return this.publicationStatus !== 'scheduled' || value instanceof Date; }, message: 'Scheduled posts need a publication time.' } },
  eventDate: { type: String, default: '', validate: { validator: validPlannerDay, message: 'Choose a valid event date.' } },
  eventTime: { type: String, default: '', validate: { validator(value) { return !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value) && (typeof this.getUpdate === 'function' || Boolean(this.eventDate)); }, message: 'Choose an event date and a valid time.' } },
  locationName: { type: String, default: '', maxlength: 200 },
  locationAddress: { type: String, default: '', maxlength: 500 },
  locationUrl: { type: String, default: '', maxlength: 2048 },
  phoneNumber: { type: String, default: '', validate: { validator: value => !value || /^\+[1-9]\d{7,14}$/.test(value), message: 'Use a valid international call number.' } },
  whatsappNumber: { type: String, default: '', validate: { validator: value => !value || /^\+[1-9]\d{7,14}$/.test(value), message: 'Use a valid international WhatsApp number.' } },
  createdAt: { type: Date, default: Date.now, immutable: true }
});

module.exports = mongoose.model('WorkshopStep', workshopStepSchema);
