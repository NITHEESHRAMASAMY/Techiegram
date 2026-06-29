const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Protected
const sendMessage = async (req, res, next) => {
  const { content, chatId, isCodeSnippet, codeLanguage } = req.body;

  if (!content || !chatId) {
    res.status(400);
    return next(new Error('Invalid data passed into request'));
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    readBy: [req.user._id],
    isCodeSnippet: isCodeSnippet || false,
    codeLanguage: codeLanguage || 'javascript',
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'username profileImage');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'username profileImage email',
    });

    await Conversation.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
// @access  Protected
const allMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'username profileImage email skills')
      .populate('chat');

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages in a chat as read
// @route   PUT /api/messages/:chatId/read
// @access  Protected
const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  allMessages,
  markAsRead,
};
