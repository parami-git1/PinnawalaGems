const express = require('express');
const router = express.Router();
const GemCategory = require('../models/GemCategory');
const Stone = require('../models/Stone');
const cloudinary = require('cloudinary').v2; 

// 1. Categories ගන්න API එක
router.get('/categories', async (req, res) => {
  try {
    const categories = await GemCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. අලුත් Category එකක් හදන API එක
router.post('/categories', async (req, res) => {
  try {
    const newCategory = new GemCategory(req.body);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. සර්ච් සහ ෆිල්ටර් පහසුකම් සහිතව ගල් ලබා ගැනීමේ API එක
router.get('/categories/:categoryId/stones', async (req, res) => {
  const { page = 1, limit = 12, stoneId, color, shape, minWeight, maxWeight, minPrice, maxPrice, hasCertificate } = req.query; 

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

    const stones = await Stone.find(findQuery)
      .sort({ isFeatured: -1, weight: 1 }) 
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Stone.countDocuments(findQuery);
    
    res.json({ stones, totalPages: Math.ceil(count / limit), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. අලුත් ගලක් එකතු කිරීම (Top Gems සහ Cut Fields ඇතුළුව)
router.post('/stones', async (req, res) => {
  try {
    const { 
      categoryId, title, description, weight, color, shape, cut, price, 
      hasCertificate, certificateDetails, certificateImage, image, 
      isFeatured, quantity, origin, additionalImages, isTopGem, homePagePosition 
    } = req.body;
    
    const category = await GemCategory.findById(categoryId);
    const prefix = category.title.toLowerCase().replace(/\s+/g, '-');
    
    const lastStone = await Stone.findOne({ categoryId }).sort({ _id: -1 });
    let nextNumber = 1;
    if (lastStone && lastStone.stoneId) {
      const parts = lastStone.stoneId.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    
    const stoneId = `${prefix}-${nextNumber}`; 
    
    const newStone = new Stone({ 
      categoryId, title, description, weight, color, shape, cut: cut || '', price, 
      hasCertificate, certificateDetails, certificateImage, image, isFeatured, stoneId,
      quantity: quantity || 1,
      origin: origin || '', 
      additionalImages: additionalImages || [],
      isTopGem: isTopGem || false,
      homePagePosition: homePagePosition || 0
    });
    
    await newStone.save();
    res.status(201).json(newStone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. ගලක් Featured/Unfeatured කිරීම
router.put('/stones/:stoneId/feature', async (req, res) => {
  try {
    const stone = await Stone.findById(req.params.stoneId);
    stone.isFeatured = !stone.isFeatured;
    await stone.save();
    res.json(stone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Category එකක තියෙන "ගල් ඔක්කොම එකපාර මකන" Route එක
router.delete('/categories/:categoryId/stones', async (req, res) => {
  try {
    const stones = await Stone.find({ categoryId: req.params.categoryId });
    
    for (const stone of stones) {
      if (stone.image && stone.image.includes('cloudinary')) {
        const publicId = stone.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      if (stone.certificateImage && stone.certificateImage.includes('cloudinary')) {
        const certPublicId = stone.certificateImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(certPublicId);
      }
      if (stone.additionalImages && stone.additionalImages.length > 0) {
        for (const img of stone.additionalImages) {
          if (img.includes('cloudinary')) {
            const pubId = img.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(pubId);
          }
        }
      }
    }

    await Stone.deleteMany({ categoryId: req.params.categoryId });
    
    res.json({ message: 'All stones in this category have been deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. ප්‍රධාන Category එක මකා දැමීම 
router.delete('/categories/:categoryId', async (req, res) => {
  try {
    const category = await GemCategory.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    let catImageUrl = category.mainImage || category.image;
    if (catImageUrl && catImageUrl.includes('cloudinary')) {
      const catPublicId = catImageUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(catPublicId);
    }
    
    if (category.coverImage && category.coverImage.includes('cloudinary')) {
      const coverPublicId = category.coverImage.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(coverPublicId);
    }

    const stones = await Stone.find({ categoryId: req.params.categoryId });
    for (const stone of stones) {
      if (stone.image && stone.image.includes('cloudinary')) {
        const publicId = stone.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      if (stone.certificateImage && stone.certificateImage.includes('cloudinary')) {
        const certPublicId = stone.certificateImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(certPublicId);
      }
      if (stone.additionalImages && stone.additionalImages.length > 0) {
        for (const img of stone.additionalImages) {
          if (img.includes('cloudinary')) {
            const pubId = img.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(pubId);
          }
        }
      }
    }

    await Stone.deleteMany({ categoryId: req.params.categoryId });
    await GemCategory.findByIdAndDelete(req.params.categoryId);
    
    res.json({ message: 'Category and all related stones deleted completely' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. තනි ගලක් මකා දැමීම
router.delete('/stones/:stoneId', async (req, res) => {
  try {
    const stone = await Stone.findById(req.params.stoneId);
    if (!stone) return res.status(404).json({ message: 'Stone not found' });

    if (stone.image && stone.image.includes('cloudinary')) {
      const publicId = stone.image.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }
    if (stone.certificateImage && stone.certificateImage.includes('cloudinary')) {
      const certPublicId = stone.certificateImage.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(certPublicId);
    }
    if (stone.additionalImages && stone.additionalImages.length > 0) {
      for (const img of stone.additionalImages) {
        if (img.includes('cloudinary')) {
          const pubId = img.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(pubId);
        }
      }
    }

    await Stone.findByIdAndDelete(req.params.stoneId);
    res.json({ message: 'Stone deleted and Cloudinary images removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. තනි ගලක් ලබා ගැනීම
router.get('/stones/:stoneId', async (req, res) => {
  try {
    const stone = await Stone.findById(req.params.stoneId);
    if (!stone) return res.status(404).json({ message: 'Stone not found' });
    res.json(stone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 10. Global Search API
router.get('/stones', async (req, res) => {
  const { page = 1, limit = 12, stoneId, gemType, color, shape, minWeight, maxWeight, minPrice, maxPrice, hasCertificate } = req.query; 

  try {
    let findQuery = {}; 

    if (stoneId) findQuery.stoneId = { $regex: stoneId, $options: 'i' }; 
    if (gemType) findQuery.title = { $regex: gemType, $options: 'i' }; 
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

    const stones = await Stone.find(findQuery).sort({ isFeatured: -1, weight: 1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Stone.countDocuments(findQuery);
    
    res.json({ stones, totalPages: Math.ceil(count / limit), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 11. Category Edit කිරීම
router.put('/categories/:categoryId', async (req, res) => {
  try {
    const updatedCategory = await GemCategory.findByIdAndUpdate(req.params.categoryId, req.body, { new: true });
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 12. ගලක් Edit කිරීම (isTopGem වෙනස් කිරීම ඇතුළුව)
router.put('/stones/:stoneId', async (req, res) => {
  try {
    const updatedStone = await Stone.findByIdAndUpdate(
      req.params.stoneId, 
      { $set: req.body }, 
      { new: true }
    );
    res.json(updatedStone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🔹 Home Page එකට විතරක් Top Gems ටික අරන් දෙන විශේෂ API එක 🔹
router.get('/top-gems', async (req, res) => {
  try {
    const topStones = await Stone.find({ isTopGem: true }).sort({ homePagePosition: 1 }).limit(10);
    res.json(topStones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;