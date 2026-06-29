const Collection = require('../models/Collection');
const Post = require('../models/Post');

// @desc    Create a new bookmark collection
// @route   POST /api/bookmarks/collections
// @access  Protected
const createCollection = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400);
      return next(new Error('Collection name is required'));
    }

    const exists = await Collection.findOne({ user: req.user._id, name });
    if (exists) {
      res.status(400);
      return next(new Error('A collection with this name already exists'));
    }

    const collection = await Collection.create({
      user: req.user._id,
      name,
      posts: [],
    });

    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookmark collections
// @route   GET /api/bookmarks/collections
// @access  Protected
const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({ user: req.user._id })
      .populate('posts')
      .sort({ createdAt: -1 });

    res.json(collections);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle post in bookmark collection
// @route   POST /api/bookmarks/collections/:id/toggle
// @access  Protected
const togglePostInCollection = async (req, res, next) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      res.status(400);
      return next(new Error('postId is required'));
    }

    const collection = await Collection.findOne({ _id: req.params.id, user: req.user._id });
    if (!collection) {
      res.status(404);
      return next(new Error('Collection not found'));
    }

    const postExists = await Post.findById(postId);
    if (!postExists) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    const inCollection = collection.posts.includes(postId);

    if (inCollection) {
      collection.posts = collection.posts.filter((id) => id.toString() !== postId);
    } else {
      collection.posts.push(postId);
    }

    await collection.save();
    
    const updatedCollection = await Collection.findById(collection._id).populate('posts');

    res.json({
      message: inCollection ? 'Post removed from collection' : 'Post added to collection',
      collection: updatedCollection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single collection's posts
// @route   GET /api/bookmarks/collections/:id
// @access  Protected
const getCollectionDetail = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, user: req.user._id })
      .populate({
        path: 'posts',
        populate: { path: 'user', select: 'username profileImage skills' },
      });

    if (!collection) {
      res.status(404);
      return next(new Error('Collection not found'));
    }

    res.json(collection);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a bookmark collection
// @route   DELETE /api/bookmarks/collections/:id
// @access  Protected
const deleteCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!collection) {
      res.status(404);
      return next(new Error('Collection not found'));
    }
    res.json({ message: 'Collection deleted successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCollection,
  getCollections,
  togglePostInCollection,
  getCollectionDetail,
  deleteCollection,
};
