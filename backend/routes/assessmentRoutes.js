const express = require('express');
const router = express.Router();
const {
  createAssessment,
  getAssessments,
  getAssessmentById,
  submitMcqAssessment,
  submitCodingAssessment,
  getLeaderboard,
  createDailyChallenge,
  getDailyChallenge,
} = require('../controllers/assessmentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getAssessments);
router.post('/', protect, admin, createAssessment);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/daily', protect, getDailyChallenge);
router.post('/daily', protect, admin, createDailyChallenge);
router.get('/:id', protect, getAssessmentById);
router.post('/:id/submit-mcq', protect, submitMcqAssessment);
router.post('/:id/submit-code', protect, submitCodingAssessment);

module.exports = router;
