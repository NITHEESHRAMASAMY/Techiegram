import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMentors,
  toggleMentorMode,
  fetchQuestions,
  askMentorQuestion,
  fetchQuestionDetail,
  answerQuestion
} from '../store/slices/phaseTwoSlice';
import { updateCurrentUserProfile } from '../store/slices/authSlice';
import { Award, ShieldAlert, Sparkles, MessageCircle, HelpCircle, Terminal, CheckCircle, Code, Plus, Users, Cpu } from 'lucide-react';

export default function Mentorship() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { mentors, questions, activeQuestion } = useSelector((state) => state.phaseTwo);

  // States
  const [activeTab, setActiveTab] = useState('mentors'); // 'mentors', 'questions', 'active-q'
  const [isMentorRegisterOpen, setIsMentorRegisterOpen] = useState(false);
  const [mentorTitle, setMentorTitle] = useState(user?.mentorTitle || '');
  const [mentorBio, setMentorBio] = useState(user?.mentorBio || '');
  const [mentorError, setMentorError] = useState('');

  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [qTitle, setQTitle] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qCode, setQCode] = useState('');
  const [qLang, setQLang] = useState('javascript');
  const [qTech, setQTech] = useState('');
  const [qDifficulty, setQDifficulty] = useState('beginner');

  const [ansText, setAnsText] = useState('');
  const [ansCode, setAnsCode] = useState('');
  const [ansLang, setAnsLang] = useState('javascript');
  const [showAnsCodeBox, setShowAnsCodeBox] = useState(false);

  // Init
  useEffect(() => {
    dispatch(fetchMentors());
    dispatch(fetchQuestions());
  }, [dispatch]);

  // Handle Mentor Toggle
  const handleToggleMentor = (e) => {
    const shouldEnable = e.target.checked;
    setMentorError('');
    if (shouldEnable) {
      if (!user.skills || user.skills.length < 3) {
        setMentorError('⚠️ Verification failed: You must have at least 3 skills in your profile before activating Mentor Mode.');
        return;
      }
      setIsMentorRegisterOpen(true);
    } else {
      dispatch(toggleMentorMode({ isMentor: false })).then((res) => {
        if (res.meta.requestStatus === 'fulfilled') {
          dispatch(updateCurrentUserProfile({ isMentor: false }));
          dispatch(fetchMentors());
        }
      });
    }
  };

  const handleRegisterMentor = () => {
    dispatch(toggleMentorMode({
      isMentor: true,
      mentorTitle,
      mentorBio
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        dispatch(updateCurrentUserProfile({
          isMentor: true,
          mentorTitle,
          mentorBio
        }));
        setIsMentorRegisterOpen(false);
        dispatch(fetchMentors());
      } else {
        setMentorError(res.payload || 'Failed to toggle mentor mode');
      }
    });
  };

  // Open Ask Question dialog
  const openAskModal = (mentor) => {
    setSelectedMentor(mentor);
    setQTech(mentor.skills?.[0] || 'JavaScript');
    setIsAskModalOpen(true);
  };

  const handleAskQuestion = () => {
    if (qTitle.trim() === '' || qDesc.trim() === '') return;
    dispatch(askMentorQuestion({
      mentorId: selectedMentor._id,
      title: qTitle,
      description: qDesc,
      codeSnippet: qCode,
      codeLanguage: qLang,
      technology: qTech,
      difficulty: qDifficulty
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setIsAskModalOpen(false);
        setQTitle('');
        setQDesc('');
        setQCode('');
        dispatch(fetchQuestions());
        setActiveTab('questions');
      }
    });
  };

  // Select Question
  const handleSelectQuestion = (qId) => {
    dispatch(fetchQuestionDetail(qId));
    setActiveTab('active-q');
  };

  // Answer question
  const handleAnswerSubmit = () => {
    if (ansText.trim() === '') return;
    dispatch(answerQuestion({
      qId: activeQuestion._id,
      text: ansText,
      codeSnippet: ansCode,
      codeLanguage: ansLang
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setAnsText('');
        setAnsCode('');
        setShowAnsCodeBox(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Mentor Mode Setup Card */}
      <div className="glass-card p-5 border-cyber-border bg-gradient-to-tr from-cyber-card/30 to-cyber-bg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="text-cyber-accent" size={18} /> Mentorship mainframe
            </h2>
            <p className="text-xs text-cyber-gray mt-1 font-mono">
              Toggle mentor mode to share code reasoning and answer community challenges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-cyber-gray font-bold font-mono">MENTOR ACCESS:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={user?.isMentor || false}
                onChange={handleToggleMentor}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-cyber-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-gray peer-checked:after:bg-cyber-bg after:border-cyber-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-accent" />
            </label>
          </div>
        </div>

        {mentorError && (
          <div className="mt-4 p-3 bg-red-950/20 text-red-400 border border-red-900/40 rounded-xl text-xs font-mono">
            {mentorError}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cyber-border pb-px">
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 font-mono ${
            activeTab === 'mentors'
              ? 'border-cyber-accent text-cyber-accent'
              : 'border-transparent text-cyber-gray hover:text-white'
          }`}
        >
          Explore Mentors
        </button>
        <button
          onClick={() => {
            dispatch(fetchQuestions());
            setActiveTab('questions');
          }}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 font-mono ${
            activeTab === 'questions'
              ? 'border-cyber-accent text-cyber-accent'
              : 'border-transparent text-cyber-gray hover:text-white'
          }`}
        >
          Q&A Workspace ({questions.length})
        </button>
        {activeQuestion && (
          <button
            onClick={() => setActiveTab('active-q')}
            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 font-mono ${
              activeTab === 'active-q'
                ? 'border-cyber-accent text-cyber-accent'
                : 'border-transparent text-cyber-gray hover:text-white'
            }`}
          >
            Active challenge Details
          </button>
        )}
      </div>

      {/* Main Tab Panels */}
      {activeTab === 'mentors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor._id} className="glass-card p-5 border-cyber-border hover:border-cyber-accent/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={mentor.profileImage || '/uploads/default-avatar.png'}
                      alt={mentor.username}
                      className="w-12 h-12 rounded-xl object-cover border border-cyber-border"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase">{mentor.username}</h3>
                      <p className="text-[10px] text-cyber-accent font-mono">{mentor.mentorTitle || 'Senior Architect'}</p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30 font-mono text-[9px] uppercase">
                    verify active
                  </div>
                </div>

                <p className="text-xs text-cyber-gray mb-4 font-mono leading-relaxed line-clamp-2">
                  {mentor.mentorBio || 'Ready to assist peers on code reviews, refactoring, and web setups.'}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {mentor.skills?.slice(0, 4).map((sk) => (
                    <span key={sk} className="text-[9px] px-2 py-0.5 rounded bg-cyber-border/40 text-white font-mono">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {mentor._id !== user._id && (
                <button
                  onClick={() => openAskModal(mentor)}
                  className="w-full btn-secondary py-2.5 text-xs text-center font-bold"
                >
                  Ask Question
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="glass-card p-12 text-center text-cyber-gray font-mono text-xs">
              No questions found on the dashboard. Ask a mentor!
            </div>
          ) : (
            questions.map((q) => {
              const isLearner = q.learner._id === user._id;
              const title = q.title;

              return (
                <div
                  key={q._id}
                  onClick={() => handleSelectQuestion(q._id)}
                  className="glass-card p-5 border-cyber-border hover:border-cyber-accent/40 cursor-pointer flex justify-between items-center transition-all bg-cyber-card/10"
                >
                  <div className="space-y-2 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple font-mono uppercase">
                        {q.technology}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase ${
                        q.difficulty === 'advanced' ? 'bg-red-950/40 text-red-400' : 'bg-emerald-950/40 text-emerald-400'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase ${
                        q.status === 'answered' ? 'bg-emerald-500 text-cyber-bg font-bold' : 'bg-cyber-border text-white'
                      }`}>
                        {q.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white hover:text-cyber-accent transition-colors">
                      {title}
                    </h3>

                    <p className="text-[10px] text-cyber-gray font-mono">
                      {isLearner ? `Mentor: @${q.mentor?.username}` : `Learner: @${q.learner?.username}`}
                    </p>
                  </div>

                  <span className="text-[10px] text-cyber-accent font-mono hover:underline">
                    Inspect Q&A &rarr;
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'active-q' && activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question detail */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 border-cyber-border space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-sm font-extrabold text-white leading-snug">{activeQuestion.title}</h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded uppercase font-mono ${
                  activeQuestion.status === 'answered' ? 'bg-emerald-500 text-cyber-bg font-bold' : 'bg-cyber-border text-white'
                }`}>
                  {activeQuestion.status}
                </span>
              </div>

              <p className="text-xs text-cyber-gray leading-relaxed">{activeQuestion.description}</p>

              {activeQuestion.codeSnippet && (
                <div className="font-mono text-left text-xs bg-black/60 rounded-xl p-3 border border-cyber-border overflow-x-auto space-y-1">
                  <span className="text-[9px] text-cyber-accent block border-b border-cyber-border/40 pb-1 mb-1.5 font-sans">
                    Attached Code Snippet ({activeQuestion.codeLanguage})
                  </span>
                  <pre className="text-white overflow-x-auto leading-5">{activeQuestion.codeSnippet}</pre>
                </div>
              )}

              <div className="flex gap-4 border-t border-cyber-border/20 pt-4 text-[10px] text-cyber-gray font-mono">
                <span>Learner: @{activeQuestion.learner?.username}</span>
                <span>Mentor: @{activeQuestion.mentor?.username}</span>
                <span>Tech: {activeQuestion.technology}</span>
              </div>
            </div>

            {/* Answers threads */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-cyber-accent uppercase font-mono tracking-wider">Solution responses</h3>
              
              {activeQuestion.answers.length === 0 ? (
                <div className="p-6 text-center text-cyber-gray text-xs font-mono">
                  No response uploaded yet.
                </div>
              ) : (
                activeQuestion.answers.map((ans) => (
                  <div key={ans._id} className="glass-card p-5 border-cyber-border bg-cyber-card/10 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={ans.user?.profileImage || '/uploads/default-avatar.png'}
                        alt={ans.user?.username}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{ans.user?.username}</span>
                        <span className="text-[8px] text-cyber-gray font-mono">{new Date(ans.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-cyber-gray leading-relaxed">{ans.text}</p>

                    {ans.codeSnippet && (
                      <div className="font-mono text-xs bg-black/60 rounded-xl p-3 border border-cyber-border/30 overflow-x-auto">
                        <pre className="text-white">{ans.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Answer editor panel */}
            <div className="glass-card p-5 border-cyber-border space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase font-mono">Submit Mentorship Answer</h4>
                <button
                  onClick={() => setShowAnsCodeBox(!showAnsCodeBox)}
                  className={`text-[10px] px-2.5 py-1 rounded font-mono border transition-colors ${
                    showAnsCodeBox ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-accent' : 'border-cyber-border text-cyber-gray'
                  }`}
                >
                  {showAnsCodeBox ? '[Hide Code Block]' : '[Attach Code Block]'}
                </button>
              </div>

              {showAnsCodeBox && (
                <div className="space-y-2.5">
                  <select
                    value={ansLang}
                    onChange={(e) => setAnsLang(e.target.value)}
                    className="text-xs bg-cyber-card border border-cyber-border text-white rounded px-2 py-1"
                  >
                    <option value="javascript">JS</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                  </select>
                  <textarea
                    placeholder="Enter code block context here..."
                    rows={4}
                    value={ansCode}
                    onChange={(e) => setAnsCode(e.target.value)}
                    className="w-full text-xs font-mono bg-cyber-bg border border-cyber-border rounded-xl p-3 text-white"
                  />
                </div>
              )}

              <textarea
                placeholder="Explain the technical solution, debugging notes..."
                rows={3}
                value={ansText}
                onChange={(e) => setAnsText(e.target.value)}
                className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl p-3 text-white"
              />

              <button
                onClick={handleAnswerSubmit}
                className="btn-primary py-2 px-5 text-xs uppercase"
              >
                Transmit Solution Response
              </button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="glass-card p-5 border-cyber-border bg-cyber-card/10">
              <h4 className="text-xs font-bold text-white uppercase font-mono mb-3">Mentorship details</h4>
              <div className="space-y-3.5 text-xs text-cyber-gray font-mono">
                <div>
                  <span className="block text-white">Learner Node:</span>
                  <span>@{activeQuestion.learner?.username}</span>
                </div>
                <div>
                  <span className="block text-white">Mentor Node:</span>
                  <span>@{activeQuestion.mentor?.username}</span>
                </div>
                <div>
                  <span className="block text-white">Skills Matrix:</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {activeQuestion.mentor?.skills?.map(s => (
                      <span key={s} className="text-[8px] bg-cyber-border/40 text-white px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentor profile Activation Dialog */}
      {isMentorRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 border-cyber-border shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-accent font-mono">Activate Mentor Profile</h3>
              <button
                onClick={() => setIsMentorRegisterOpen(false)}
                className="text-cyber-gray hover:text-white"
              >
                [close]
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Mentor Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Architect"
                  value={mentorTitle}
                  onChange={(e) => setMentorTitle(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Mentor Bio</label>
                <textarea
                  placeholder="Describe your architecture experiences, frameworks expertise..."
                  rows={3}
                  value={mentorBio}
                  onChange={(e) => setMentorBio(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <button
              onClick={handleRegisterMentor}
              className="w-full btn-primary py-2.5 text-xs uppercase"
            >
              Verify & Register Profile
            </button>
          </div>
        </div>
      )}

      {/* Ask Question Dialog */}
      {isAskModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border-cyber-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-accent font-mono">
                Ask Question to @{selectedMentor.username}
              </h3>
              <button
                onClick={() => setIsAskModalOpen(false)}
                className="text-cyber-gray hover:text-white"
              >
                [close]
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Difficulty level</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value)}
                    className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2 text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Technology Tag</label>
                  <select
                    value={qTech}
                    onChange={(e) => setQTech(e.target.value)}
                    className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2 text-white"
                  >
                    {selectedMentor.skills?.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="General">General/Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Question Title</label>
                <input
                  type="text"
                  placeholder="e.g. Reducer returns undefined state in async thunks"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Description / Details</label>
                <textarea
                  placeholder="Elaborate on details, explain the issues you encounter..."
                  rows={3}
                  value={qDesc}
                  onChange={(e) => setQDesc(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl p-3 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Attach Code snippet (optional)</label>
                <textarea
                  placeholder="Paste your code snippet here..."
                  rows={4}
                  value={qCode}
                  onChange={(e) => setQCode(e.target.value)}
                  className="w-full text-xs font-mono bg-cyber-bg border border-cyber-border rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <button
              onClick={handleAskQuestion}
              className="w-full btn-primary py-2.5 text-xs uppercase"
            >
              Broadcast Question Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
