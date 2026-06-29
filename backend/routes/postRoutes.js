const express = require('express');
const router = express.Router();
const {
  createPost,
  editPost,
  deletePost,
  toggleLikePost,
  addComment,
  toggleSavePost,
  getPostById,
  logPostView,
} = require('../controllers/postController');
const {
  getFeedPosts,
  getSavedPosts,
  getUserPosts,
} = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get list endpoints (order matters: check specific paths before variable params)
router.get('/feed', protect, getFeedPosts);
router.get('/saved', protect, getSavedPosts);
router.get('/user/:username', protect, getUserPosts);

// Single post operations
router.post('/', protect, upload.single('media'), createPost);
router.get('/:id', protect, getPostById);
router.put('/:id', protect, editPost);
router.delete('/:id', protect, deletePost);

// Actions
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comments', protect, addComment);
router.post('/:id/save', protect, toggleSavePost);
router.post('/:id/view', protect, logPostView);

module.exports = router;
