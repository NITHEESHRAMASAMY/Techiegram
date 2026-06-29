const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment text cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: [true, 'Media is required'],
    },
    mediaType: {
      type: String,
      required: true,
      enum: ['image', 'video'],
    },
    caption: {
      type: String,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      default: '',
    },
    hashtags: {
      type: [String],
      default: [],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
    saves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderationReport: {
      approved: Boolean,
      rejectionReason: String,
      relevanceScore: Number,
      edgeDensity: Number,
      transcript: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for feed retrieval and text-based search
postSchema.index({ hashtags: 1 });
postSchema.index({ caption: 'text' });
postSchema.index({ user: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
