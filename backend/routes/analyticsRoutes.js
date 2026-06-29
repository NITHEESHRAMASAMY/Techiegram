const express = require('express');
const router = express.Router();
const { getUserLearningAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/learning', protect, getUserLearningAnalytics);

module.exports = router;
