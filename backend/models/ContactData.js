const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  address: { type: String, default: 'Pinnawala, Sri Lanka' },
  landlineNumber: { type: String, default: '+94 35 123 4567' },
  landlineNumber2: { type: String, default: '' },
  mobileNumber: { type: String, default: '+94 77 659 9740' },
  mobileNumber2: { type: String, default: '' },
  email: { type: String, default: 'paramividarshanamuthumali@gmail.com' },
  openingHours: { type: String, default: 'Mon - Sat: 09:00 AM - 06:00 PM | Sun: Closed' },
  facebookLink: { type: String, default: '' },
  instagramLink: { type: String, default: '' },
  tiktokLink: { type: String, default: '' },
  // 🔹 අලුත් Video සහ Multiple Images
  contactImages: { type: [String], default: ['https://images.unsplash.com/photo-1582647617478-f79a95782782?auto=format&fit=crop&q=80&w=1200'] },
  contactVideo: { type: String, default: '' }, 
  googleMapsLink: { type: String, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126746.54148419163!2d79.88092289419175!3d7.275990262100803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2d80f84a44fdd%3A0xe543e37130eb5cb2!2sPinnawala!5e0!3m2!1sen!2slk!4v1715421258674!5m2!1sen!2slk' }
});

module.exports = mongoose.model('ContactData', contactSchema);