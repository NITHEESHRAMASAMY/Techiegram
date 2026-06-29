const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  toggleMentorMode,
  getMentors,
  askQuestion,
  getQuestions,
  getQuestionDetails,
  answerQuestion,
} = require('../controllers/mentorController');

router.route('/').get(protect, getMentors);
router.route('/toggle').put(protect, toggleMentorMode);
router.route('/questions').post(protect, askQuestion).get(protect, getQuestions);
router.route('/questions/:id').get(protect, getQuestionDetails);
router.route('/questions/:id/answers').post(protect, answerQuestion);

module.exports = router;
