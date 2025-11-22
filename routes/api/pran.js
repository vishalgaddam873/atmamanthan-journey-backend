const express = require('express');
const router = express.Router();
const Pran = require('../../models/Pran');
const authMiddleware = require('../../middleware/auth');

// Get all prans
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const prans = await Pran.find(query).sort({ category: 1, sequence: 1 });
    res.json(prans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pran by ID
router.get('/:id', async (req, res) => {
  try {
    const pran = await Pran.findById(req.params.id);
    if (!pran) {
      return res.status(404).json({ error: 'Pran not found' });
    }
    res.json(pran);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create pran (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const pran = new Pran(req.body);
    await pran.save();
    res.status(201).json(pran);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update pran (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pran = await Pran.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!pran) {
      return res.status(404).json({ error: 'Pran not found' });
    }
    res.json(pran);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete pran (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pran = await Pran.findByIdAndDelete(req.params.id);
    if (!pran) {
      return res.status(404).json({ error: 'Pran not found' });
    }
    res.json({ message: 'Pran deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

