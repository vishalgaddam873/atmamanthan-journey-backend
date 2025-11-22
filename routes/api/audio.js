const express = require('express');
const router = express.Router();
const Audio = require('../../models/Audio');
const authMiddleware = require('../../middleware/auth');

// Get all audios
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    let audios = await Audio.find(query).sort({ category: 1, sequence: 1 });
    // Filter out Welcome_to_Yatra audio (repetitive)
    audios = audios.filter(audio => 
      !audio.fileName.toLowerCase().includes('welcome_to_yatra') && 
      !audio.fileName.toLowerCase().includes('welcome-to-yatra')
    );
    res.json(audios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audio by ID
router.get('/:id', async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    res.json(audio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create audio (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const audio = new Audio(req.body);
    await audio.save();
    res.status(201).json(audio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update audio (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const audio = await Audio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    res.json(audio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete audio (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const audio = await Audio.findByIdAndDelete(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    res.json({ message: 'Audio deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

