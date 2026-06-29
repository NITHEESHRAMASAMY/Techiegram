const Community = require('../models/Community');
const CommunityPost = require('../models/CommunityPost');
const Notification = require('../models/Notification');

// @desc    Create a new community
// @route   POST /api/communities
// @access  Protected
const createCommunity = async (req, res, next) => {
  try {
    const { name, description, topic } = req.body;
    if (!name || !topic) {
      res.status(400);
      return next(new Error('Please include name and topic'));
    }

    const exists = await Community.findOne({ name });
    if (exists) {
      res.status(400);
      return next(new Error('Community name already taken'));
    }

    const community = await Community.create({
      name,
      description,
      topic,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(community);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all communities
// @route   GET /api/communities
// @access  Protected
const getCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find()
      .populate('createdBy', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(communities);
  } catch (error) {
    next(error);
  }
};

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Protected
const joinCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      res.status(404);
      return next(new Error('Community not found'));
    }

    if (community.members.includes(req.user._id)) {
      res.status(400);
      return next(new Error('Already a member'));
    }

    community.members.push(req.user._id);
    await community.save();

    res.json({ message: 'Joined community successfully', members: community.members });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Protected
const leaveCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      res.status(404);
      return next(new Error('Community not found'));
    }

    community.members = community.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    await community.save();

    res.json({ message: 'Left community successfully', members: community.members });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a community post
// @route   POST /api/communities/:id/posts
// @access  Protected
const createCommunityPost = async (req, res, next) => {
  try {
    const { title, content, codeSnippet, codeLanguage, difficulty } = req.body;
    if (!title || !content) {
      res.status(400);
      return next(new Error('Title and content are required'));
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      res.status(404);
      return next(new Error('Community not found'));
    }

    const post = await CommunityPost.create({
      community: req.params.id,
      user: req.user._id,
      title,
      content,
      codeSnippet,
      codeLanguage,
      difficulty: difficulty || 'beginner',
    });

    const populated = await CommunityPost.findById(post._id).populate(
      'user',
      'username profileImage skills'
    );

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get community posts
// @route   GET /api/communities/:id/posts
// @access  Protected
const getCommunityPosts = async (req, res, next) => {
  try {
    const posts = await CommunityPost.find({ community: req.params.id })
      .populate('user', 'username profileImage skills')
      .populate('comments.user', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to community post
// @route   POST /api/communities/posts/:postId/comments
// @access  Protected
const addCommunityComment = async (req, res, next) => {
  try {
    const { text, codeSnippet, codeLanguage } = req.body;
    if (!text) {
      res.status(400);
      return next(new Error('Comment text is required'));
    }

    const post = await CommunityPost.findById(req.params.postId);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    const newComment = {
      user: req.user._id,
      text,
      codeSnippet: codeSnippet || '',
      codeLanguage: codeLanguage || 'javascript',
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await CommunityPost.findById(req.params.postId)
      .populate('comments.user', 'username profileImage')
      .populate('user', 'username profileImage');

    const comment = updatedPost.comments[updatedPost.comments.length - 1];

    // Trigger notification if reply is on someone else's post
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'community_post',
        commentText: `replied to community post: "${post.title}"`,
      });
    }

    res.status(201).json({ comment, commentsCount: updatedPost.comments.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like community post
// @route   POST /api/communities/posts/:postId/like
// @access  Protected
const toggleLikeCommunityPost = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({
      likes: post.likes,
      likesCount: post.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCommunity,
  getCommunities,
  joinCommunity,
  leaveCommunity,
  createCommunityPost,
  getCommunityPosts,
  addCommunityComment,
  toggleLikeCommunityPost,
};
