const User = require('../models/User');
const Question = require('../models/Question');
const Notification = require('../models/Notification');

// @desc    Toggle Mentor Mode (Requires at least 3 skills)
// @route   PUT /api/mentors/toggle
// @access  Protected
const toggleMentorMode = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const { mentorTitle, mentorBio, isMentor } = req.body;

    if (isMentor) {
      if (!user.skills || user.skills.length < 3) {
        res.status(400);
        return next(
          new Error('Verification failed: You must add at least 3 skills in your profile settings before activating Mentor Mode.')
        );
      }
      user.isMentor = true;
      user.mentorTitle = mentorTitle || 'Technical Mentor';
      user.mentorBio = mentorBio || '';
    } else {
      user.isMentor = false;
    }

    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      isMentor: user.isMentor,
      mentorTitle: user.mentorTitle,
      mentorBio: user.mentorBio,
      skills: user.skills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all mentors
// @route   GET /api/mentors
// @access  Protected
const getMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({ isMentor: true })
      .select('username profileImage bio skills mentorTitle mentorBio followers following')
      .limit(30);

    res.json(mentors);
  } catch (error) {
    next(error);
  }
};

// @desc    Ask a question to a mentor
// @route   POST /api/mentors/questions
// @access  Protected
const askQuestion = async (req, res, next) => {
  try {
    const { mentorId, title, description, codeSnippet, codeLanguage, technology, difficulty } = req.body;

    if (!mentorId || !title || !description || !technology) {
      res.status(400);
      return next(new Error('Please provide mentorId, title, description, and technology'));
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.isMentor) {
      res.status(404);
      return next(new Error('Mentor not found or not active'));
    }

    const question = await Question.create({
      learner: req.user._id,
      mentor: mentorId,
      title,
      description,
      codeSnippet: codeSnippet || '',
      codeLanguage: codeLanguage || 'javascript',
      technology,
      difficulty: difficulty || 'beginner',
      status: 'open',
    });

    // Create Notification
    await Notification.create({
      recipient: mentorId,
      sender: req.user._id,
      type: 'question_ask',
      question: question._id,
      commentText: `asked you: "${title}"`,
    });

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions asked to me or by me
// @route   GET /api/mentors/questions
// @access  Protected
const getQuestions = async (req, res, next) => {
  try {
    const { role } = req.query; // 'mentor' or 'learner'
    let filter = {};

    if (role === 'mentor') {
      filter = { mentor: req.user._id };
    } else if (role === 'learner') {
      filter = { learner: req.user._id };
    } else {
      filter = { $or: [{ mentor: req.user._id }, { learner: req.user._id }] };
    }

    const questions = await Question.find(filter)
      .populate('learner', 'username profileImage')
      .populate('mentor', 'username profileImage')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get question details by ID
// @route   GET /api/mentors/questions/:id
// @access  Protected
const getQuestionDetails = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('learner', 'username profileImage skills')
      .populate('mentor', 'username profileImage skills')
      .populate('answers.user', 'username profileImage skills');

    if (!question) {
      res.status(404);
      return next(new Error('Question not found'));
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
};

// @desc    Answer a question
// @route   POST /api/mentors/questions/:id/answers
// @access  Protected
const answerQuestion = async (req, res, next) => {
  try {
    const { text, codeSnippet, codeLanguage } = req.body;
    if (!text) {
      res.status(400);
      return next(new Error('Answer text is required'));
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      res.status(404);
      return next(new Error('Question not found'));
    }

    const answer = {
      user: req.user._id,
      text,
      codeSnippet: codeSnippet || '',
      codeLanguage: codeLanguage || 'javascript',
    };

    question.answers.push(answer);
    question.status = 'answered';
    await question.save();

    // Notify the learner if the answer is from the mentor (or someone else)
    const recipient = req.user._id.toString() === question.learner.toString() ? question.mentor : question.learner;
    
    await Notification.create({
      recipient,
      sender: req.user._id,
      type: 'question_answer',
      question: question._id,
      commentText: `replied to the question: "${question.title}"`,
    });

    const updatedQuestion = await Question.findById(req.params.id)
      .populate('learner', 'username profileImage')
      .populate('mentor', 'username profileImage')
      .populate('answers.user', 'username profileImage');

    res.status(201).json(updatedQuestion);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleMentorMode,
  getMentors,
  askQuestion,
  getQuestions,
  getQuestionDetails,
  answerQuestion,
};
