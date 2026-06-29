const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Safely execute code submissions inside a timeout-restricted child process
const executeCodeSandbox = (language, code, input) => {
  return new Promise((resolve) => {
    const filename = `sandbox_${crypto.randomBytes(8).toString('hex')}`;
    let ext = '';
    let command = '';
    
    if (language === 'javascript' || language === 'nodejs') {
      ext = '.js';
      const wrapperCode = `
        const inputData = ${JSON.stringify(input)};
        ${code}
        if (typeof solution === 'function') {
          console.log(solution(inputData));
        } else {
          // If no solution function, just run raw
        }
      `;
      const filePath = path.join(__dirname, `${filename}${ext}`);
      fs.writeFileSync(filePath, wrapperCode);
      command = `node "${filePath}"`;
    } else if (language === 'python') {
      ext = '.py';
      const wrapperCode = `
import sys
input_data = ${JSON.stringify(input)}
${code}
if 'solution' in globals():
    print(solution(input_data))
`;
      const filePath = path.join(__dirname, `${filename}${ext}`);
      fs.writeFileSync(filePath, wrapperCode);
      command = `python "${filePath}"`;
    } else {
      // Mock success for java or unsupported compilers in local container setups
      return resolve({ success: true, stdout: 'mock execution success' });
    }
    
    const tempFile = path.join(__dirname, `${filename}${ext}`);
    
    exec(command, { timeout: 2000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      // Clean up temp file immediately
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      
      if (error) {
        if (error.killed) {
          return resolve({ success: false, error: 'Time Limit Exceeded (TLE)' });
        }
        return resolve({ success: false, error: stderr || error.message });
      }
      resolve({ success: true, stdout: stdout.trim() });
    });
  });
};

// Gamification helper to award XP, track streaks, and level up users
const awardXpAndCheckStreak = async (user, xpEarned) => {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now - user.lastActive) / oneDay);
  
  if (diffDays === 1) {
    user.streak += 1;
  } else if (diffDays > 1) {
    user.streak = 1; // Reset streak if user missed a day
  } else if (user.streak === 0) {
    user.streak = 1; // Start streak
  }
  
  user.lastActive = now;
  user.xp += xpEarned;
  
  const targetLevel = Math.floor(user.xp / 1000) + 1;
  let levelUp = false;
  
  if (targetLevel > user.level) {
    user.level = targetLevel;
    levelUp = true;
    const levelBadge = `Level ${targetLevel} Dev`;
    if (!user.badges.includes(levelBadge)) {
      user.badges.push(levelBadge);
    }
  }
  
  // Award badges based on milestones
  if (user.streak >= 7 && !user.badges.includes('7-Day Streak Master')) {
    user.badges.push('7-Day Streak Master');
  }
  if (user.xp >= 5000 && !user.badges.includes('Tech Elite')) {
    user.badges.push('Tech Elite');
  }
  
  await user.save();
  return { level: user.level, streak: user.streak, levelUp, badges: user.badges };
};

// @desc    Create new Assessment
// @route   POST /api/assessments
// @access  Admin Protected
const createAssessment = async (req, res, next) => {
  try {
    const { title, description, type, difficulty, questions, testCases, xpReward } = req.body;
    const assessment = await Assessment.create({
      title,
      description,
      type,
      difficulty,
      questions,
      testCases,
      xpReward,
    });
    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Assessments
// @route   GET /api/assessments
// @access  Protected
const getAssessments = async (req, res, next) => {
  try {
    const assessments = await Assessment.find({});
    res.json(assessments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Assessment by ID
// @route   GET /api/assessments/:id
// @access  Protected
const getAssessmentById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      res.status(404);
      throw new Error('Assessment not found');
    }
    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answers for MCQ Assessment
// @route   POST /api/assessments/:id/submit-mcq
// @access  Protected
const submitMcqAssessment = async (req, res, next) => {
  try {
    const { answers } = req.body; // Array of correct option indices chosen by user
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment || assessment.type !== 'mcq') {
      res.status(400);
      throw new Error('Valid MCQ Assessment not found');
    }

    let correctCount = 0;
    assessment.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correctOptionIndex) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / assessment.questions.length) * 100);
    const passed = score >= 70; // 70% threshold to pass and claim rewards
    
    let xpEarned = 0;
    let gamificationReport = {};
    
    if (passed) {
      xpEarned = assessment.xpReward || 100;
      const user = await User.findById(req.user._id);
      gamificationReport = await awardXpAndCheckStreak(user, xpEarned);
    }

    const submission = await Submission.create({
      user: req.user._id,
      assessment: assessment._id,
      answers,
      status: passed ? 'pass' : 'fail',
      score,
      xpEarned,
    });

    res.json({
      submission,
      passed,
      score,
      correctCount,
      totalCount: assessment.questions.length,
      xpEarned,
      gamificationReport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit code for Coding Assessment
// @route   POST /api/assessments/:id/submit-code
// @access  Protected
const submitCodingAssessment = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment || assessment.type !== 'coding') {
      res.status(400);
      throw new Error('Valid Coding Challenge not found');
    }

    let passedAll = true;
    const testCasesReports = [];

    // Execute sandbox for each test case
    for (const tc of assessment.testCases) {
      const execResult = await executeCodeSandbox(language, code, tc.input);
      const isCorrect = execResult.success && execResult.stdout === tc.expectedOutput;
      
      if (!isCorrect) {
        passedAll = false;
      }

      testCasesReports.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: execResult.stdout || '',
        error: execResult.error || null,
        passed: isCorrect,
      });
    }

    const status = passedAll ? 'pass' : 'fail';
    let xpEarned = 0;
    let gamificationReport = {};

    if (passedAll) {
      xpEarned = assessment.xpReward || 100;
      const user = await User.findById(req.user._id);
      gamificationReport = await awardXpAndCheckStreak(user, xpEarned);
    }

    const submission = await Submission.create({
      user: req.user._id,
      assessment: assessment._id,
      code,
      language,
      status,
      score: passedAll ? 100 : 0,
      xpEarned,
    });

    res.json({
      submission,
      passed: passedAll,
      testCasesReports,
      xpEarned,
      gamificationReport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Gamified XP Leaderboard
// @route   GET /api/assessments/leaderboard
// @access  Protected
const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await User.find({})
      .sort({ xp: -1 })
      .limit(20)
      .select('username xp level badges profileImage');
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

// @desc    Create Daily Challenge
// @route   POST /api/assessments/daily
// @access  Admin Protected
const createDailyChallenge = async (req, res, next) => {
  try {
    const { title, description, type, questions, testCases, xpReward, date } = req.body;
    const challenge = await Challenge.create({
      title,
      description,
      type,
      questions,
      testCases,
      xpReward,
      date: new Date(date).setUTCHours(0,0,0,0),
    });
    res.status(201).json(challenge);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Daily Challenge
// @route   GET /api/assessments/daily
// @access  Protected
const getDailyChallenge = async (req, res, next) => {
  try {
    const today = new Date().setUTCHours(0,0,0,0);
    const challenge = await Challenge.findOne({ date: today });
    if (!challenge) {
      res.status(404);
      throw new Error('Daily challenge not found for today');
    }
    res.json(challenge);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  submitMcqAssessment,
  submitCodingAssessment,
  getLeaderboard,
  createDailyChallenge,
  getDailyChallenge,
};
