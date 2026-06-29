const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');
const os = require('os');

// @desc    Get dashboard metrics for administrators
// @route   GET /api/admin/metrics
// @access  Admin Protected
const getAdminDashboardMetrics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalPosts = await Post.countDocuments({});
    const rejectedPosts = await Post.countDocuments({ moderationStatus: 'rejected' });
    const pendingPosts = await Post.countDocuments({ moderationStatus: 'pending' });
    const onlineUsers = await User.countDocuments({ onlineStatus: 'online' });
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const systemInfo = {
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      uptime: os.uptime(),
      cpuUsage: os.loadavg(),
      nodeMemory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      }
    };

    res.json({
      totalUsers,
      totalPosts,
      rejectedPosts,
      pendingPosts,
      onlineUsers,
      systemInfo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated users list
// @route   GET /api/admin/users
// @access  Admin Protected
const getUsersList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const totalCount = await User.countDocuments(query);
    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .select('-password');

    res.json({
      users,
      page,
      pages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (user/admin)
// @route   PUT /api/admin/users/:id/role
// @access  Admin Protected
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role specified');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role successfully updated to ${role}`,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually override post moderation status
// @route   PUT /api/admin/posts/:id/moderate
// @access  Admin Protected
const moderatePostAction = async (req, res, next) => {
  try {
    const { moderationStatus, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(moderationStatus)) {
      res.status(400);
      throw new Error('Invalid moderation status');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    post.moderationStatus = moderationStatus;
    if (post.moderationReport) {
      post.moderationReport.approved = moderationStatus === 'approved';
      post.moderationReport.rejectionReason = rejectionReason || 'Manually modified by Administrator';
    } else {
      post.moderationReport = {
        approved: moderationStatus === 'approved',
        rejectionReason: rejectionReason || 'Manually modified by Administrator',
        relevanceScore: 1.0,
        edgeDensity: 0.0,
        transcript: ''
      };
    }

    await post.save();
    res.json({
      message: `Post moderation overrides set to ${moderationStatus}`,
      post
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboardMetrics,
  getUsersList,
  updateUserRole,
  moderatePostAction
};
