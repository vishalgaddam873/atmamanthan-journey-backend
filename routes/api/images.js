const express = require('express');
const router = express.Router();
const Image = require('../../models/Image');
const authMiddleware = require('../../middleware/auth');

// Get images with filters
router.get('/', async (req, res) => {
  try {
    const { category, ageGroup, type } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (ageGroup) query.ageGroup = ageGroup;
    if (type) query.type = type;
    
    const images = await Image.find(query).sort({ displayOrder: 1, createdAt: 1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get image by ID
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create image (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const image = new Image(req.body);
    await image.save();
    res.status(201).json(image);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update image (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete image (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

