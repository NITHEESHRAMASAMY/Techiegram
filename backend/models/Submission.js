const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
    },
    answers: {
      type: [Number], // Storing indices of chosen options for MCQ
      default: [],
    },
    code: {
      type: String, // Storing code submission for coding challenges
      default: '',
    },
    language: {
      type: String, // 'javascript', 'python', 'java'
      default: '',
    },
    status: {
      type: String,
      enum: ['pass', 'fail'],
      default: 'fail',
    },
    score: {
      type: Number,
      default: 0,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Query optimizations for leaderboards
submissionSchema.index({ user: 1, assessment: 1 });
submissionSchema.index({ score: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
