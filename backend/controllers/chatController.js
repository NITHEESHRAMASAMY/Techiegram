const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Access or create a 1-on-1 chat
// @route   POST /api/chats
// @access  Protected
const accessChat = async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    return next(new Error('userId param not sent with request'));
  }

  try {
    let isChat = await Conversation.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    isChat = await User.populate(isChat, {
      path: 'latestMessage.sender',
      select: 'username profileImage email',
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: 'sender',
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Conversation.create(chatData);
      const FullChat = await Conversation.findOne({ _id: createdChat._id }).populate(
        'users',
        '-password'
      );
      res.status(200).send(FullChat);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chats
// @access  Protected
const fetchChats = async (req, res, next) => {
  try {
    Conversation.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'username profileImage email skills',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a group chat
// @route   POST /api/chats/group
// @access  Protected
const createGroupChat = async (req, res, next) => {
  if (!req.body.users || !req.body.name) {
    res.status(400);
    return next(new Error('Please fill all the fields'));
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    res.status(400);
    return next(new Error('More than 2 users are required to form a group chat'));
  }

  // Include current user in group
  users.push(req.user);

  try {
    const groupChat = await Conversation.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Conversation.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    next(error);
  }
};

// @desc    Rename group chat
// @route   PUT /api/chats/rename
// @access  Protected
const renameGroup = async (req, res, next) => {
  const { chatId, chatName } = req.body;

  try {
    const updatedChat = await Conversation.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      res.status(404);
      return next(new Error('Chat Not Found'));
    } else {
      res.json(updatedChat);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group chat
// @route   PUT /api/chats/groupadd
// @access  Protected
const addToGroup = async (req, res, next) => {
  const { chatId, userId } = req.body;

  try {
    const added = await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!added) {
      res.status(404);
      return next(new Error('Chat Not Found'));
    } else {
      res.json(added);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group chat
// @route   PUT /api/chats/groupremove
// @access  Protected
const removeFromGroup = async (req, res, next) => {
  const { chatId, userId } = req.body;

  try {
    const removed = await Conversation.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!removed) {
      res.status(404);
      return next(new Error('Chat Not Found'));
    } else {
      res.json(removed);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
