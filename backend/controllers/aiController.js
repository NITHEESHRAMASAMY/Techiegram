// @desc    Generate structured roadmap for skills
// @route   POST /api/ai/roadmap
// @access  Protected
const generateLearningRoadmap = async (req, res, next) => {
  try {
    const { skill } = req.body;
    if (!skill) {
      res.status(400);
      throw new Error('Please specify a technology or skill');
    }

    try {
      const response = await fetch('http://localhost:8000/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill })
      });
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (err) {
      console.error('[AI Microservice Offline] Using roadmap fallback:', err.message);
    }

    // Fallback roadmap generator
    const fallbackRoadmaps = {
      react: {
        skill,
        roadmap: [
          { step: 1, title: 'JavaScript Essentials', topics: ['ES6 Syntax', 'Promises & Async/Await', 'DOM manipulation'] },
          { step: 2, title: 'React Core Principles', topics: ['JSX', 'Functional Components', 'Props & State'] },
          { step: 3, title: 'React Hooks', topics: ['useState', 'useEffect', 'useContext', 'Custom Hooks'] },
          { step: 4, title: 'State Management & Routing', topics: ['Redux Toolkit', 'React Router DOM'] }
        ]
      },
      python: {
        skill,
        roadmap: [
          { step: 1, title: 'Python Basics', topics: ['Variables', 'Data Types', 'Loops', 'Conditionals'] },
          { step: 2, title: 'Object-Oriented Programming', topics: ['Classes', 'Inheritance', 'Methods'] },
          { step: 3, title: 'Libraries & Data Structures', topics: ['Lists', 'Dicts', 'Pandas', 'NumPy'] },
          { step: 4, title: 'Backend Frameworks', topics: ['Flask', 'FastAPI', 'Django'] }
        ]
      }
    };

    const normSkill = skill.toLowerCase();
    const result = fallbackRoadmaps[normSkill] || {
      skill,
      roadmap: [
        { step: 1, title: `Introduction to ${skill}`, topics: ['Basic installation', 'Syntax and setup'] },
        { step: 2, title: `Intermediate ${skill}`, topics: ['Key abstractions', 'Working with APIs'] },
        { step: 3, title: `Advanced Application`, topics: ['Performance tuning', 'Production deployment'] }
      ]
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate MCQ quiz questions
// @route   POST /api/ai/quiz
// @access  Protected
const generateQuizQuestions = async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      res.status(400);
      throw new Error('Please specify a topic for quiz generation');
    }

    try {
      const response = await fetch('http://localhost:8000/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (err) {
      console.error('[AI Microservice Offline] Using quiz fallback:', err.message);
    }

    // Fallback quiz generator
    const defaultQuizzes = {
      questions: [
        {
          questionText: `What is a primary use case of the virtual DOM in React?`,
          options: [
            'To directly modify browser window settings',
            'To optimize render efficiency by comparing and batch-updating changes',
            'To encrypt CSS styling scripts',
            'To create backend database schemas'
          ],
          correctOptionIndex: 1
        },
        {
          questionText: `Which of the following is NOT a valid hook in React?`,
          options: ['useState', 'useEffect', 'useCallback', 'useStateVariable'],
          correctOptionIndex: 3
        }
      ]
    };
    res.json(defaultQuizzes);
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with AI coding assistant
// @route   POST /api/ai/assistant
// @access  Protected
const getLearningAssistantChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400);
      throw new Error('Please send a message for the chatbot assistant');
    }

    try {
      const response = await fetch('http://localhost:8000/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (err) {
      console.error('[AI Microservice Offline] Using assistant fallback:', err.message);
    }

    res.json({
      reply: `I am currently in local fallback mode because the AI server is busy. However, regarding your query about technical development: Always make sure to write clean, modular components, optimize database indexes, and compile code in sandbox clusters!`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateLearningRoadmap,
  generateQuizQuestions,
  getLearningAssistantChat
};
