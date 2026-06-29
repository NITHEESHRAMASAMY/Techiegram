const Post = require('../models/Post');
const User = require('../models/User');
const Interaction = require('../models/Interaction');

// @desc    Get paginated feed posts (Following users + latest public fallback)
// @route   GET /api/posts/feed
// @access  Protected
const getFeedPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // AI recommendation path for the first page
    if (page === 1) {
      try {
        const allUsers = await User.find({}, '_id username skills');
        const allPosts = await Post.find({ moderationStatus: 'approved' }, '_id hashtags user');
        const allInteractions = await Interaction.find({});

        const recResponse = await fetch('http://localhost:8000/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: req.user._id.toString(),
            users: allUsers,
            posts: allPosts,
            interactions: allInteractions,
            limit: 20
          })
        });

        if (recResponse.ok) {
          const { recommended_ids } = await recResponse.json();
          if (recommended_ids && recommended_ids.length > 0) {
            const posts = await Post.find({ _id: { $in: recommended_ids }, moderationStatus: 'approved' })
              .populate('user', 'username profileImage skills')
              .populate('comments.user', 'username profileImage');
            
            // Sort to respect the exact order of recommended IDs
            const sortedPosts = posts.sort((a, b) => {
              return recommended_ids.indexOf(a._id.toString()) - recommended_ids.indexOf(b._id.toString());
            });

            return res.json({
              posts: sortedPosts,
              page: 1,
              pages: 1,
              totalCount: sortedPosts.length,
              hasMore: false
            });
          }
        }
      } catch (aiErr) {
        console.error('[AI Recommendation Engine Offline]:', aiErr.message);
      }
    }

    // Chronological fallback (or for pages > 1)
    const currentUser = await User.findById(req.user._id);
    const followingIds = currentUser.following || [];

    let query = { moderationStatus: 'approved' };
    
    if (followingIds.length > 0) {
      query.user = { $in: [...followingIds, req.user._id] };
    }

    let totalCount = await Post.countDocuments(query);

    // Fallback: If followed posts count is 0, show global latest public posts
    if (totalCount === 0) {
      query = { moderationStatus: 'approved' };
      totalCount = await Post.countDocuments(query);
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profileImage skills')
      .populate('comments.user', 'username profileImage');

    res.json({
      posts,
      page,
      pages: Math.ceil(totalCount / limit),
      totalCount,
      hasMore: page * limit < totalCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved posts for current user
// @route   GET /api/posts/saved
// @access  Protected
const getSavedPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await Post.countDocuments({ saves: req.user._id });

    const posts = await Post.find({ saves: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profileImage skills')
      .populate('comments.user', 'username profileImage');

    res.json({
      posts,
      page,
      pages: Math.ceil(totalCount / limit),
      totalCount,
      hasMore: page * limit < totalCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by user ID or username
// @route   GET /api/posts/user/:username
// @access  Protected
const getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'username profileImage skills')
      .populate('comments.user', 'username profileImage');

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Global Search (users, skills, and hashtags)
// @route   GET /api/search
// @access  Protected
const search = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.json({ users: [], skills: [], posts: [], hashtags: [] });
    }

    // 1. Search Users
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
    })
      .select('username profileImage bio skills followers following')
      .limit(10);

    // 2. Search Skills (users matching specific skill)
    const skillUsers = await User.find({
      skills: { $regex: q, $options: 'i' },
    })
      .select('username profileImage bio skills')
      .limit(10);

    // 3. Search Posts by Hashtags
    // Strip hash sign if provided
    const searchTag = q.startsWith('#') ? q.slice(1).toLowerCase() : q.toLowerCase();
    const hashtagPosts = await Post.find({
      hashtags: { $regex: searchTag, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username profileImage skills')
      .limit(15);

    // 4. Search Posts by caption/text
    const textPosts = await Post.find({
      caption: { $regex: q, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username profileImage skills')
      .limit(15);

    // Filter unique posts
    const postIds = new Set();
    const uniquePosts = [];
    
    [...hashtagPosts, ...textPosts].forEach((post) => {
      if (!postIds.has(post._id.toString())) {
        postIds.add(post._id.toString());
        uniquePosts.push(post);
      }
    });

    res.json({
      users,
      skills: skillUsers,
      posts: uniquePosts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Advanced Search (by Technology, Difficulty, Creator)
// @route   GET /api/search/advanced
// @access  Protected
const advancedSearch = async (req, res, next) => {
  try {
    const { tech, difficulty, creator, type } = req.query;
    
    let results = {
      posts: [],
      questions: [],
      communities: [],
      users: []
    };

    // 1. Resolve Creator User ID if username is provided
    let creatorId = null;
    if (creator) {
      const creatorUser = await User.findOne({ username: { $regex: creator, $options: 'i' } });
      if (creatorUser) {
        creatorId = creatorUser._id;
      } else {
        return res.json(results);
      }
    }

    // Helper filters
    const getCreatorFilter = (userFieldName) => {
      return creatorId ? { [userFieldName]: creatorId } : {};
    };

    const getDifficultyFilter = () => {
      return difficulty ? { difficulty } : {};
    };

    const getTechFilter = (textFields, arrayFields) => {
      if (!tech) return {};
      const searchRegex = { $regex: tech, $options: 'i' };
      const queries = [];
      if (textFields) {
        textFields.forEach(field => {
          queries.push({ [field]: searchRegex });
        });
      }
      if (arrayFields) {
        arrayFields.forEach(field => {
          queries.push({ [field]: searchRegex });
        });
      }
      return queries.length > 0 ? { $or: queries } : {};
    };

    const runPostsQuery = !type || type === 'all' || type === 'posts';
    const runQuestionsQuery = !type || type === 'all' || type === 'questions';
    const runCommunitiesQuery = !type || type === 'all' || type === 'communities';
    const runUsersQuery = (!type || type === 'all' || type === 'users') && !difficulty;

    if (runPostsQuery) {
      const postQuery = {
        ...getCreatorFilter('user'),
        ...getDifficultyFilter(),
        ...getTechFilter(['caption'], ['hashtags'])
      };
      results.posts = await Post.find(postQuery)
        .sort({ createdAt: -1 })
        .populate('user', 'username profileImage skills')
        .limit(20);
    }

    if (runQuestionsQuery) {
      const questionQuery = {
        ...getDifficultyFilter(),
        ...getTechFilter(['title', 'description', 'technology'], [])
      };
      
      if (creatorId) {
        questionQuery.$or = [
          { learner: creatorId },
          { mentor: creatorId }
        ];
      }
      
      results.questions = await Question.find(questionQuery)
        .sort({ createdAt: -1 })
        .populate('learner', 'username profileImage')
        .populate('mentor', 'username profileImage')
        .limit(20);
    }

    if (runCommunitiesQuery) {
      const communityQuery = {
        ...getCreatorFilter('createdBy'),
        ...getTechFilter(['name', 'description', 'topic'], [])
      };
      results.communities = await Community.find(communityQuery)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'username profileImage')
        .limit(20);
    }

    if (runUsersQuery) {
      const userQuery = {
        ...getTechFilter([], ['skills'])
      };
      if (creatorId) {
        userQuery._id = creatorId;
      }
      results.users = await User.find(userQuery)
        .select('username profileImage bio skills isMentor mentorTitle')
        .limit(20);
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeedPosts,
  getSavedPosts,
  getUserPosts,
  search,
  advancedSearch,
};
