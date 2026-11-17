const mongoose = require('mongoose');
const contactSchema = new mongoose.Schema({
  address: { type: String, default: 'No.348, Main Street, Eheliyagoda, Eheliyagoda, Sri Lanka' },
  landlineNumber: { type: String, default: '0769254499' }, landlineNumber2: { type: String, default: '' },
  mobileNumber: { type: String, default: '+94778307334' }, mobileNumber2: { type: String, default: '' },
  email: { type: String, default: 'Pinnawalagemsandlapidary@gmail.com' },
  openingHours: { type: String, default: 'Mon - Sat: 09:00 AM - 06:00 PM | Sun: Closed' },
  facebookLink: { type: String, default: '' }, instagramLink: { type: String, default: '' }, tiktokLink: { type: String, default: '' },
  contactImages: { type: [String], default: [] }, contactVideo: { type: String, default: '' }, googleMapsLink: { type: String, default: '' },
});
module.exports = mongoose.model('ContactData', contactSchema);
