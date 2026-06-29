const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    type: {
      type: String,
      enum: ['view', 'like', 'comment', 'save'],
      required: true,
    },
    watchTime: {
      type: Number,
      default: 0, // In seconds (applicable for views)
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries and uniqueness
interactionSchema.index({ user: 1, post: 1, type: 1 });
interactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
