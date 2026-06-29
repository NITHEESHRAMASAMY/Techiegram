const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  {
    timestamps: true,
  }
);

collectionSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Collection', collectionSchema);
