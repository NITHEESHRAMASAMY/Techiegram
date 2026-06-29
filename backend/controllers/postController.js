const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Interaction = require('../models/Interaction');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');

// Asynchronous moderation dispatcher calling FastAPI microservice
const runAsyncModeration = async (postId, filePath, mimetype, originalname, caption, hashtags, shouldCleanup) => {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: mimetype });
    formData.append('video', fileBlob, originalname);
    formData.append('caption', caption || '');
    formData.append('hashtags', JSON.stringify(hashtags));

    const response = await fetch('http://localhost:8000/moderation/video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('AI microservice returned error status');

    const report = await response.json();

    const post = await Post.findById(postId);
    if (post) {
      post.moderationStatus = report.approved ? 'approved' : 'rejected';
      post.moderationReport = {
        approved: report.approved,
        rejectionReason: report.rejection_reason || '',
        relevanceScore: report.relevance_score || 1.0,
        edgeDensity: report.edge_density || 0.0,
        transcript: report.transcript || '',
      };
      await post.save();
      console.log(`[AI Moderation] Post ${postId} processed. Status: ${post.moderationStatus}`);
    }
  } catch (err) {
    console.error(`[AI Moderation Error] Failed moderating post ${postId}:`, err.message);
    // Auto-approve fallback if FastAPI service is offline
    const post = await Post.findById(postId);
    if (post) {
      post.moderationStatus = 'approved';
      post.moderationReport = {
        approved: true,
        rejectionReason: 'AI service offline. System bypass.',
        relevanceScore: 1.0,
        edgeDensity: 0.0,
        transcript: '',
      };
      await post.save();
    }
  } finally {
    if (shouldCleanup && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Protected
const createPost = async (req, res, next) => {
  try {
    const { caption } = req.body;
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image or video');
    }

    // Determine media type
    const isVideo = req.file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    let mediaUrl = '';
    let localPathForModeration = req.file.path;
    let shouldCleanup = false;

    // Upload to Cloudinary if configured
    if (isCloudinaryConfigured) {
      try {
        const uploadOptions = {
          folder: 'techiegram_posts',
          resource_type: 'auto', // Auto handles video, image, raw
        };
        
        const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
        mediaUrl = result.secure_url;
        shouldCleanup = true;
      } catch (uploadError) {
        console.error('Cloudinary upload failed, falling back to local file storage:', uploadError.message);
        mediaUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    // Extract hashtags from caption
    const hashtags = caption
      ? (caption.match(/#\w+/g) || []).map((tag) => tag.slice(1).toLowerCase())
      : [];

    const post = await Post.create({
      user: req.user._id,
      mediaUrl,
      mediaType,
      caption,
      hashtags,
      moderationStatus: 'pending',
    });

    // Fire off async moderation
    runAsyncModeration(
      post._id,
      localPathForModeration,
      req.file.mimetype,
      req.file.originalname,
      caption,
      hashtags,
      shouldCleanup
    );

    const populatedPost = await Post.findById(post._id).populate(
      'user',
      'username profileImage skills'
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a post caption/hashtags
// @route   PUT /api/posts/:id
// @access  Protected
const editPost = async (req, res, next) => {
  try {
    const { caption } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Verify ownership
    if (post.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('User not authorized to edit this post');
    }

    if (caption !== undefined) {
      post.caption = caption;
      // Re-extract hashtags
      post.hashtags = (caption.match(/#\w+/g) || []).map((tag) =>
        tag.slice(1).toLowerCase()
      );
    }

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id).populate(
      'user',
      'username profileImage skills'
    );

    res.json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Protected
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Verify ownership
    if (post.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('User not authorized to delete this post');
    }

    // Delete local file if it is stored locally
    if (post.mediaUrl.startsWith('/uploads/')) {
      const filePath = require('path').join(__dirname, '../public', post.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else if (isCloudinaryConfigured && post.mediaUrl.includes('res.cloudinary.com')) {
      // Optional: Delete from Cloudinary
      try {
        const publicId = post.mediaUrl.split('/').pop().split('.')[0];
        const resourceType = post.mediaType === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(`techiegram_posts/${publicId}`, { resource_type: resourceType });
      } catch (err) {
        console.error('Cloudinary destruction failed:', err.message);
      }
    }

    await post.deleteOne();

    res.json({ message: 'Post removed successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike a post
// @route   POST /api/posts/:id/like
// @access  Protected
const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
      await Interaction.deleteMany({ user: req.user._id, post: post._id, type: 'like' });
    } else {
      post.likes.push(req.user._id);
      await Interaction.create({ user: req.user._id, post: post._id, type: 'like' });
    }

    await post.save();

    if (!isLiked && post.user.toString() !== req.user._id.toString()) {
      try {
        const notif = await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: 'like',
          post: post._id,
          commentText: 'liked your post',
        });
        const populatedNotif = await Notification.findById(notif._id)
          .populate('sender', 'username profileImage')
          .populate('post', 'caption mediaUrl mediaType');
        if (global.io) {
          global.io.to(post.user.toString()).emit('notification_received', populatedNotif);
        }
      } catch (err) {
        console.error('Error sending like notification:', err);
      }
    }

    res.json({
      likes: post.likes,
      likesCount: post.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Protected
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    // Call Toxicity endpoint on FastAPI
    try {
      const toxicityRes = await fetch('http://localhost:8000/moderation/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: text }),
      });
      if (toxicityRes.ok) {
        const report = await toxicityRes.json();
        if (report.is_toxic) {
          res.status(400);
          return next(new Error('Comment rejected: Content classified as toxic or abusive.'));
        }
      }
    } catch (err) {
      console.error('[Comment Moderation Bypass] FastAPI service offline:', err.message);
      // Fallback local dictionary check
      const toxicWords = ["hate", "fool", "stupid", "idiot", "fuck", "shit"];
      if (toxicWords.some(word => text.toLowerCase().includes(word))) {
        res.status(400);
        return next(new Error('Comment rejected: Content contains blacklisted terms.'));
      }
    }

    const newComment = {
      user: req.user._id,
      text,
    };

    post.comments.push(newComment);
    await post.save();
    await Interaction.create({ user: req.user._id, post: post._id, type: 'comment' });

    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'username profileImage')
      .populate('user', 'username profileImage');

    // Return the newly created comment (the last comment in the array)
    const comment = updatedPost.comments[updatedPost.comments.length - 1];

    if (post.user.toString() !== req.user._id.toString()) {
      try {
        const notif = await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: 'comment',
          post: post._id,
          commentText: `commented on your post: "${text}"`,
        });
        const populatedNotif = await Notification.findById(notif._id)
          .populate('sender', 'username profileImage')
          .populate('post', 'caption mediaUrl mediaType');
        if (global.io) {
          global.io.to(post.user.toString()).emit('notification_received', populatedNotif);
        }
      } catch (err) {
        console.error('Error sending comment notification:', err);
      }
    }

    res.status(201).json({ comment, commentsCount: updatedPost.comments.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Save / Unsave a post
// @route   POST /api/posts/:id/save
// @access  Protected
const toggleSavePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (isSaved) {
      post.saves = post.saves.filter((id) => id.toString() !== req.user._id.toString());
      await Interaction.deleteMany({ user: req.user._id, post: post._id, type: 'save' });
    } else {
      post.saves.push(req.user._id);
      await Interaction.create({ user: req.user._id, post: post._id, type: 'save' });
    }

    await post.save();
    res.json({
      saves: post.saves,
      isSaved: !isSaved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Protected
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profileImage skills')
      .populate('comments.user', 'username profileImage');

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Log post view / watch time
// @route   POST /api/posts/:id/view
// @access  Protected
const logPostView = async (req, res, next) => {
  try {
    const { watchTime } = req.body;
    await Interaction.create({
      user: req.user._id,
      post: req.params.id,
      type: 'view',
      watchTime: watchTime || 0,
    });
    res.json({ message: 'Interaction logged successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  editPost,
  deletePost,
  toggleLikePost,
  addComment,
  toggleSavePost,
  getPostById,
  logPostView,
};
