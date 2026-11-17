const mongoose = require('mongoose');
const homeDataSchema = new mongoose.Schema({
  heroTitle: { type: String, default: 'CEYLON SAPPHIRES' },
  brandIntro: { type: String, default: 'Discover natural gemstones, ethically sourced and masterfully cut in Sri Lanka.' },
  address: { type: String, default: 'No.348, Main Street, Eheliyagoda, Eheliyagoda, Sri Lanka' },
  contactNumber: { type: String, default: '0769254499' }, whatsappNumber: { type: String, default: '94778307334' },
  inquiryEmail: { type: String, default: 'Pinnawalagemsandlapidary@gmail.com' }, googleMapsLink: { type: String, default: '' },
  topGems: [{ image: { type: String, required: true }, name: { type: String, default: '' }, weight: { type: String, default: '' } }],
  sideAdImage: { type: String, default: '' }, bottomAdImage: { type: String, default: '' }, customerPhotos: { type: [String], default: [] },
  showEvent: { type: Boolean, default: false }, eventText: { type: String, default: '' }, eventLink: { type: String, default: '' },
});
module.exports = mongoose.model('HomeData', homeDataSchema);
