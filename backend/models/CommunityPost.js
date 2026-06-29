const mongoose = require('mongoose');

const communityCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Reply text is required'],
      trim: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    codeLanguage: {
      type: String,
      default: 'javascript',
    },
  },
  {
    timestamps: true,
  }
);

const communityPostSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    codeLanguage: {
      type: String,
      default: 'javascript',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [communityCommentSchema],
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ community: 1 });
communityPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
