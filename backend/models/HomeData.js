const mongoose = require('mongoose');

const homeDataSchema = new mongoose.Schema({
  heroTitle: { type: String, default: 'CEYLON SAPPHIRES' }, 
  brandIntro: { type: String, default: 'Discover the world’s finest natural gemstones, ethically sourced and masterfully cut in Sri Lanka.' }, 
  address: { type: String, default: 'Pinnawala, Sri Lanka' }, 
  contactNumber: { type: String, default: '+94 77 123 4567' }, 
  
  // Aluthin add karapu fields 2
  whatsappNumber: { type: String, default: '94776599740' }, 
  inquiryEmail: { type: String, default: 'paramividarshanamuthumali@gmail.com' }, 
  
  googleMapsLink: { type: String, default: '' } ,


topGems: [{
    image: { type: String, required: true },
    name: { type: String, default: '' },
    weight: { type: String, default: '' }
  }],
    sideAdImage: { type: String, default: '' },
  bottomAdImage: { type: String, default: '' },

  customerPhotos: { type: [String], default: [] }

});



module.exports = mongoose.model('HomeData', homeDataSchema);