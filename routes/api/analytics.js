const express = require('express');
const router = express.Router();
const SessionHistory = require('../../models/SessionHistory');
const auth = require('../../middleware/auth');

// Get all analytics data
router.get('/', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      ageGroup,
      mood,
      category,
      pran
    } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) filter.completedAt.$gte = new Date(startDate);
      if (endDate) filter.completedAt.$lte = new Date(endDate);
    }
    if (ageGroup) filter.ageGroup = ageGroup;
    if (mood) filter.mood = mood;
    if (category) filter.category = category;
    if (pran) filter.pran = parseInt(pran);

    const sessions = await SessionHistory.find(filter).sort({ completedAt: -1 });

    res.json({
      success: true,
      data: sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) filter.completedAt.$gte = new Date(startDate);
      if (endDate) filter.completedAt.$lte = new Date(endDate);
    }

    const sessions = await SessionHistory.find(filter);

    // Age Group Distribution
    const ageGroupStats = {};
    sessions.forEach(session => {
      ageGroupStats[session.ageGroup] = (ageGroupStats[session.ageGroup] || 0) + 1;
    });

    // Mood Distribution
    const moodStats = {};
    sessions.forEach(session => {
      moodStats[session.mood] = (moodStats[session.mood] || 0) + 1;
    });

    // Category Distribution
    const categoryStats = {};
    sessions.forEach(session => {
      categoryStats[session.category] = (categoryStats[session.category] || 0) + 1;
    });

    // Pran Distribution
    const pranStats = {};
    sessions.forEach(session => {
      pranStats[session.pran] = (pranStats[session.pran] || 0) + 1;
    });

    // Recent sessions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = await SessionHistory.find({
      completedAt: { $gte: sevenDaysAgo }
    }).sort({ completedAt: -1 });

    // Daily sessions count (last 7 days)
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await SessionHistory.countDocuments({
        completedAt: { $gte: date, $lt: nextDate }
      });
      
      dailyStats[date.toISOString().split('T')[0]] = count;
    }

    res.json({
      success: true,
      stats: {
        total: sessions.length,
        ageGroupDistribution: ageGroupStats,
        moodDistribution: moodStats,
        categoryDistribution: categoryStats,
        pranDistribution: pranStats,
        recentSessions: recentSessions.length,
        dailyStats: dailyStats
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get age group analytics
router.get('/age-groups', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) filter.completedAt.$gte = new Date(startDate);
      if (endDate) filter.completedAt.$lte = new Date(endDate);
    }

    const sessions = await SessionHistory.find(filter);
    
    const stats = {
      KIDS: { count: 0, moods: {}, categories: {}, prans: {} },
      'PRE-TEEN': { count: 0, moods: {}, categories: {}, prans: {} },
      'TEEN+': { count: 0, moods: {}, categories: {}, prans: {} }
    };

    sessions.forEach(session => {
      const group = stats[session.ageGroup];
      group.count++;
      
      // Mood distribution for this age group
      group.moods[session.mood] = (group.moods[session.mood] || 0) + 1;
      
      // Category distribution
      group.categories[session.category] = (group.categories[session.category] || 0) + 1;
      
      // Pran distribution
      group.prans[session.pran] = (group.prans[session.pran] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Age group analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pran analytics
router.get('/prans', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) filter.completedAt.$gte = new Date(startDate);
      if (endDate) filter.completedAt.$lte = new Date(endDate);
    }

    const sessions = await SessionHistory.find(filter);
    
    const pranStats = {};
    for (let i = 1; i <= 12; i++) {
      pranStats[i] = {
        count: 0,
        ageGroups: {},
        moods: {},
        categories: {}
      };
    }

    sessions.forEach(session => {
      const pran = pranStats[session.pran];
      pran.count++;
      
      pran.ageGroups[session.ageGroup] = (pran.ageGroups[session.ageGroup] || 0) + 1;
      pran.moods[session.mood] = (pran.moods[session.mood] || 0) + 1;
      pran.categories[session.category] = (pran.categories[session.category] || 0) + 1;
    });

    res.json({
      success: true,
      data: pranStats
    });
  } catch (error) {
    console.error('Pran analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
