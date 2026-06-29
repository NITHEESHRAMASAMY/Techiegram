const Interaction = require('../models/Interaction');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @desc    Get aggregated learning analytics for the logged-in user
// @route   GET /api/analytics/learning
// @access  Protected
const getUserLearningAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Total Watch Time Analysis
    const watchTimeStats = await Interaction.aggregate([
      { $match: { user: userId, type: 'view' } },
      { $group: { _id: null, totalWatchTime: { $sum: '$watchTime' } } }
    ]);
    const totalWatchTime = watchTimeStats.length > 0 ? watchTimeStats[0].totalWatchTime : 0;

    // 2. Skill Growth Tracking (Languages completed in sandbox assessments)
    const skillGrowth = await Submission.aggregate([
      { $match: { user: userId, status: 'pass' } },
      { $lookup: { from: 'assessments', localField: 'assessment', foreignField: '_id', as: 'assessmentDetails' } },
      { $unwind: '$assessmentDetails' },
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]);
    const skillsReport = skillGrowth.map(sg => ({
      language: sg._id || 'Conceptual MCQ',
      challengesPassed: sg.count
    }));

    // 3. Weekly Learning Progress Reports (XP increments over recent days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklySubmissions = await Submission.find({
      user: userId,
      status: 'pass',
      createdAt: { $gte: sevenDaysAgo }
    }).select('xpEarned createdAt');

    // Aggregate submissions by day
    const xpProgression = Array(7).fill(0);
    const dayLabels = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayLabels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    }

    weeklySubmissions.forEach(sub => {
      const dayDiff = Math.floor((new Date() - sub.createdAt) / (1000 * 60 * 60 * 24));
      if (dayDiff >= 0 && dayDiff < 7) {
        const index = 6 - dayDiff;
        xpProgression[index] += sub.xpEarned;
      }
    });

    res.json({
      totalWatchTimeSeconds: totalWatchTime,
      totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
      skillsReport,
      weeklyReport: {
        labels: dayLabels,
        xpData: xpProgression
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserLearningAnalytics
};
