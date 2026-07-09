const mongoose = require('mongoose'); // Import Mongoose

// Define the structure (schema) for a Gem document in the database
const gemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // This field is mandatory
    trim: true // Automatically removes extra spaces from the beginning and end of the title
  },
  description: {
    type: String,
    required: true // A mandatory detailed description of the gem
  },
  category: {
    type: String, // E.g., "Sapphire", "Ruby", "Emerald"
    required: true
  },
  primaryColor: {
    type: String, // The main color of the gem, used for filtering on the frontend catalog
    required: true
  },
  mainImage: {
    type: String, // URL of the primary image to be displayed on the catalog card
    required: true
  },
  // An array of objects to store different variations (designs and weights) for this specific gem
  variations: [
    {
      weight: { 
        type: String, 
        required: true 
      }, // E.g., "2.0 Carats", "1.5 Carats"
      designName: { 
        type: String 
      }, // E.g., "Oval Cut", "Cushion Cut", "Princess Cut"
      images: [
        { type: String } // An array of image URLs specific to this design/variation
      ]
    }
  ]
}, { 
  timestamps: true // Automatically adds 'createdAt' and 'updatedAt' timestamps to track when the gem was added
});

// Export the 'Gem' model so it can be used in other files (like API controllers)
module.exports = mongoose.model('Gem', gemSchema);