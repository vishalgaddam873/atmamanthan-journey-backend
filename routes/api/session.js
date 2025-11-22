const express = require('express');
const router = express.Router();
const Session = require('../../models/Session');

// Get current session
router.get('/', async (req, res) => {
  try {
    const session = await Session.getLiveSession();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset session
router.post('/reset', async (req, res) => {
  try {
    const session = await Session.getLiveSession();
    session.ageGroup = null;
    session.mood = null;
    session.category = null;
    session.pran = null;
    session.currentPhase = 'INIT';
    session.currentAudio = null;
    session.currentCue = 0;
    session.audioState = 'STOPPED';
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update session
router.put('/', async (req, res) => {
  try {
    const session = await Session.getLiveSession();
    const updates = req.body;
    
    Object.keys(updates).forEach(key => {
      if (session.schema.paths[key]) {
        session[key] = updates[key];
      }
    });
    
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize session (same as reset)
router.post('/init', async (req, res) => {
  try {
    const session = await Session.getLiveSession();
    session.ageGroup = null;
    session.mood = null;
    session.category = null;
    session.pran = null;
    session.currentPhase = 'INIT';
    session.currentAudio = null;
    session.currentCue = 0;
    session.audioState = 'STOPPED';
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

