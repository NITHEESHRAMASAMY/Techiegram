const express = require('express');
const router = express.Router();
const {
  generateLearningRoadmap,
  generateQuizQuestions,
  getLearningAssistantChat,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/roadmap', protect, generateLearningRoadmap);
router.post('/quiz', protect, generateQuizQuestions);
router.post('/assistant', protect, getLearningAssistantChat);

module.exports = router;
