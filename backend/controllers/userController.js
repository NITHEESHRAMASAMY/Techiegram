const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get user profile by username
// @route   GET /api/users/profile/:username
// @access  Protected
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username profileImage')
      .populate('following', 'username profileImage');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get posts counts
    const postsCount = await Post.countDocuments({ user: user._id });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      skills: user.skills,
      followers: user.followers,
      following: user.following,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      postsCount,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit user profile
// @route   PUT /api/users/profile
// @access  Protected
const editUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update bio
    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }

    // Update skills - Parse if it's JSON or comma separated string
    if (req.body.skills !== undefined) {
      try {
        if (typeof req.body.skills === 'string') {
          // Check if stringified JSON array
          if (req.body.skills.startsWith('[')) {
            user.skills = JSON.parse(req.body.skills);
          } else {
            user.skills = req.body.skills
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
        } else if (Array.isArray(req.body.skills)) {
          user.skills = req.body.skills;
        }
      } catch (err) {
        user.skills = [];
      }
    }

    // Update profile image if file is uploaded
    if (req.file) {
      if (isCloudinaryConfigured) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'techiegram_avatars',
            width: 150,
            height: 150,
            crop: 'thumb',
            gravity: 'face',
          });
          user.profileImage = result.secure_url;
          // Delete local file after successful upload to Cloudinary
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (uploadError) {
          console.error('Cloudinary avatar upload error, falling back to local path:', uploadError.message);
          user.profileImage = `/uploads/${req.file.filename}`;
        }
      } else {
        // Fallback local static path
        user.profileImage = `/uploads/${req.file.filename}`;
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      bio: updatedUser.bio,
      skills: updatedUser.skills,
      followersCount: updatedUser.followers.length,
      followingCount: updatedUser.following.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/follow/:id
// @access  Protected
const toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      res.status(400);
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
      await currentUser.save();
      await targetUser.save();
      res.json({ message: 'User unfollowed successfully', isFollowing: false });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      try {
        const notif = await Notification.create({
          recipient: targetUserId,
          sender: currentUserId,
          type: 'follow',
          commentText: 'started following you',
        });
        const populatedNotif = await Notification.findById(notif._id).populate(
          'sender',
          'username profileImage'
        );
        if (global.io) {
          global.io.to(targetUserId.toString()).emit('notification_received', populatedNotif);
        }
      } catch (err) {
        console.error('Error sending follow notification:', err);
      }

      res.json({ message: 'User followed successfully', isFollowing: true });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  editUserProfile,
  toggleFollow,
};
