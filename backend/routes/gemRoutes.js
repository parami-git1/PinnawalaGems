const express = require('express');
const router = express.Router();
const Gem = require('../models/Gem'); // Import the Gem schema we created earlier

// ==========================================
// 1. ADD A NEW GEM (Admin Only) - POST Request
// Route: POST /api/gems
// ==========================================
router.post('/', async (req, res) => {
  try {
    // req.body eken ena details (title, price, variations) aragena aluth Gem ekak hadanawa
    const newGem = new Gem(req.body); 
    
    // Eka database eke save karanawa
    const savedGem = await newGem.save(); 
    
    // Save unata passe, save una data tika response ekak widihata yawanawa (Status 201 = Created)
    res.status(201).json(savedGem); 
  } catch (error) {
    // Monawa hari waradunoth error message eka yawanawa
    res.status(500).json({ message: 'Error adding gem', error: error.message });
  }
});

// ==========================================
// 2. GET ALL GEMS (Public Catalog) - GET Request
// Route: GET /api/gems
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Database eke thiyena okkoma gems tika gannawa. 
    // .sort({ createdAt: -1 }) dapu nisa aluthinma add karapu gems mulin enawa
    const gems = await Gem.find().sort({ createdAt: -1 }); 
    
    // Gems tika frontend ekata yawanawa (Status 200 = OK)
    res.status(200).json(gems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gems', error: error.message });
  }
});

// DELETE a gem by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedGem = await Gem.findByIdAndDelete(req.params.id);
    if (!deletedGem) {
      return res.status(404).json({ message: "Gem not found" });
    }
    res.status(200).json({ message: "Gem deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting gem", error });
  }
});

// GET a single gem by ID
router.get('/:id', async (req, res) => {
  try {
    const gem = await Gem.findById(req.params.id);
    if (!gem) {
      return res.status(404).json({ message: "Gem not found" });
    }
    res.status(200).json(gem);
  } catch (error) {
    res.status(500).json({ message: "Error fetching gem", error });
  }
});

module.exports = router;