const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  editUserProfile,
  toggleFollow,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, upload.single('profileImage'), editUserProfile);
router.post('/follow/:id', protect, toggleFollow);

module.exports = router;
