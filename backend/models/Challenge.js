const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'coding'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
        },
        correctOptionIndex: {
          type: Number,
          required: true,
        },
      },
    ],
    testCases: [
      {
        input: {
          type: String,
          required: true,
        },
        expectedOutput: {
          type: String,
          required: true,
        },
      },
    ],
    xpReward: {
      type: Number,
      default: 150,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

challengeSchema.index({ date: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
