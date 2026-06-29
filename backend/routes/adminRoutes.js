const express = require('express');
const router = express.Router();
const {
  getAdminDashboardMetrics,
  getUsersList,
  updateUserRole,
  moderatePostAction,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/metrics', protect, admin, getAdminDashboardMetrics);
router.get('/users', protect, admin, getUsersList);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.put('/posts/:id/moderate', protect, admin, moderatePostAction);

module.exports = router;
