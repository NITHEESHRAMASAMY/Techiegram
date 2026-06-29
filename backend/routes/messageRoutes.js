const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, allMessages, markAsRead } = require('../controllers/messageController');

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, allMessages);
router.route('/:chatId/read').put(protect, markAsRead);

module.exports = router;
