const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createCommunity,
  getCommunities,
  joinCommunity,
  leaveCommunity,
  createCommunityPost,
  getCommunityPosts,
  addCommunityComment,
  toggleLikeCommunityPost,
} = require('../controllers/communityController');

router.route('/').post(protect, createCommunity).get(protect, getCommunities);
router.route('/:id/join').post(protect, joinCommunity);
router.route('/:id/leave').post(protect, leaveCommunity);
router.route('/:id/posts').post(protect, createCommunityPost).get(protect, getCommunityPosts);
router.route('/posts/:postId/comments').post(protect, addCommunityComment);
router.route('/posts/:postId/like').post(protect, toggleLikeCommunityPost);

module.exports = router;
