const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Community name must be at least 3 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      required: [true, 'Topic/Technology is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Community', communitySchema);
