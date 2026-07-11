const express = require('express');
const router = express.Router();
const StockCategory = require('../models/StockCategory');
const StockStone = require('../models/StockStone');
const cloudinary = require('cloudinary').v2; // 🔹 Cloudinary එකතු කළා

// 1. Get all Stock Categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await StockCategory.find();
    res.json(categories);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Add new Stock Category
router.post('/categories', async (req, res) => {
  try {
    const newCategory = new StockCategory(req.body);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// 3. Get Stones for a Stock Category 
router.get('/categories/:categoryId/stones', async (req, res) => {
  const { stoneId, color, shape, minWeight, maxWeight, minPrice, maxPrice, hasCertificate } = req.query;

  try {
    let findQuery = { categoryId: req.params.categoryId };

    if (stoneId) findQuery.stoneId = { $regex: stoneId, $options: 'i' };
    if (color) findQuery.color = { $regex: color, $options: 'i' };
    if (shape) findQuery.shape = { $regex: shape, $options: 'i' };

    if (minWeight || maxWeight) {
      findQuery.weight = {};
      if (minWeight) findQuery.weight.$gte = parseFloat(minWeight);
      if (maxWeight) findQuery.weight.$lte = parseFloat(maxWeight);
    }

    if (minPrice || maxPrice) {
      findQuery.price = {};
      if (minPrice) findQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) findQuery.price.$lte = parseFloat(maxPrice);
    }

    if (hasCertificate === 'true') {
      findQuery.hasCertificate = true;
    }

    const stones = await StockStone.find(findQuery);
    res.json({ stones });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. Add new Stock Stone
router.post('/stones', async (req, res) => {
  try {
    const { categoryId, title, quantity, ...rest } = req.body;
    const category = await StockCategory.findById(categoryId);
    const prefix = category.title.toLowerCase().replace(/\s+/g, '-');
    
    const lastStone = await StockStone.findOne({ categoryId }).sort({ _id: -1 });
    let nextNumber = 1;
    if (lastStone && lastStone.stoneId) {
      const parts = lastStone.stoneId.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    
    const stoneId = `${prefix}-stock-${nextNumber}`; 
    
    const newStone = new StockStone({ categoryId, title, quantity: quantity || 1, stoneId, ...rest });
    await newStone.save();
    res.status(201).json(newStone);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// 5. Update Stock Stone
router.put('/stones/:stoneId', async (req, res) => {
  try {
    const updated = await StockStone.findByIdAndUpdate(req.params.stoneId, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// 6. 🔹 Delete Stock Stone (Update කර ඇත)
router.delete('/stones/:stoneId', async (req, res) => {
  try {
    const stone = await StockStone.findById(req.params.stoneId);
    if(stone) {
      if (stone.image && stone.image.includes('cloudinary')) {
        const publicId = stone.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      if (stone.certificateImage && stone.certificateImage.includes('cloudinary')) {
        const certPublicId = stone.certificateImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(certPublicId);
      }
      await StockStone.findByIdAndDelete(req.params.stoneId);
    }
    res.json({ message: 'Stock Stone and images deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 7. 🔹 Delete Stock Category (Update කර ඇත)
router.delete('/categories/:categoryId', async (req, res) => {
  try {
    const category = await StockCategory.findById(req.params.categoryId);
    if(category) {
      let catImageUrl = category.mainImage || category.image;
      if (catImageUrl && catImageUrl.includes('cloudinary')) {
        const catPublicId = catImageUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(catPublicId);
      }
    }

    const stones = await StockStone.find({ categoryId: req.params.categoryId });
    for (const stone of stones) {
      if (stone.image && stone.image.includes('cloudinary')) {
        const publicId = stone.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      if (stone.certificateImage && stone.certificateImage.includes('cloudinary')) {
        const certPublicId = stone.certificateImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(certPublicId);
      }
    }

    await StockStone.deleteMany({ categoryId: req.params.categoryId });
    await StockCategory.findByIdAndDelete(req.params.categoryId);
    res.json({ message: 'Stock Category and related stones deleted completely.' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

module.exports = router;