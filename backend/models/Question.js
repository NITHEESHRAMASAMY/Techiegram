const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Answer text is required'],
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

const questionSchema = new mongoose.Schema(
  {
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Question description is required'],
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
    technology: {
      type: String,
      required: [true, 'Technology/Topic tag is required'],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    status: {
      type: String,
      enum: ['open', 'answered', 'closed'],
      default: 'open',
    },
    answers: [answerSchema],
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ mentor: 1 });
questionSchema.index({ learner: 1 });
questionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
