import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  fetchCommunityPosts,
  createCommunityPost,
  addCommunityComment,
  toggleLikeCommunityPost
} from '../store/slices/phaseTwoSlice';
import { Plus, Shield, MessageSquare, Terminal, HelpCircle, Heart, Code, Hash, Users } from 'lucide-react';

export default function Communities() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { communities, activeCommunity, communityPosts } = useSelector((state) => state.phaseTwo);

  // States
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceTopic, setSpaceTopic] = useState('javascript');

  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCode, setPostCode] = useState('');
  const [postLang, setPostLang] = useState('javascript');
  const [postDifficulty, setPostDifficulty] = useState('beginner');

  const [replyText, setReplyText] = useState({});
  const [replyCode, setReplyCode] = useState({});
  const [replyLang, setReplyLang] = useState({});
  const [showReplyCodeBox, setShowReplyCodeBox] = useState({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);

  // Init
  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  // Load posts when active community changes
  const handleSelectCommunity = (comm) => {
    dispatch(fetchCommunityPosts(comm._id));
    // Set active community in slice via dispatcher trigger
    dispatch({ type: 'phaseTwo/setActiveCommunity', payload: comm });
  };

  const handleCreateSpace = () => {
    if (spaceName.trim() === '' || spaceTopic.trim() === '') return;
    dispatch(createCommunity({
      name: spaceName,
      description: spaceDesc,
      topic: spaceTopic
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setIsCreateSpaceOpen(false);
        setSpaceName('');
        setSpaceDesc('');
      }
    });
  };

  const handleJoinLeave = (comm) => {
    const isMember = comm.members.includes(user._id);
    if (isMember) {
      dispatch(leaveCommunity(comm._id)).then(() => dispatch(fetchCommunities()));
    } else {
      dispatch(joinCommunity(comm._id)).then(() => dispatch(fetchCommunities()));
    }
  };

  const handleCreatePost = () => {
    if (postTitle.trim() === '' || postContent.trim() === '') return;
    dispatch(createCommunityPost({
      commId: activeCommunity._id,
      title: postTitle,
      content: postContent,
      codeSnippet: postCode,
      codeLanguage: postLang,
      difficulty: postDifficulty
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setIsNewPostOpen(false);
        setPostTitle('');
        setPostContent('');
        setPostCode('');
      }
    });
  };

  const handleAddReply = (postId) => {
    const commentText = replyText[postId];
    if (!commentText || commentText.trim() === '') return;

    dispatch(addCommunityComment({
      postId,
      text: commentText,
      codeSnippet: replyCode[postId] || '',
      codeLanguage: replyLang[postId] || 'javascript'
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setReplyText({ ...replyText, [postId]: '' });
        setReplyCode({ ...replyCode, [postId]: '' });
        setShowReplyCodeBox({ ...showReplyCodeBox, [postId]: false });
      }
    });
  };

  const activeCommData = communities.find(c => c._id === activeCommunity?._id) || activeCommunity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[80vh]">
      {/* Left Sidebar: Space lists */}
      <div className="lg:col-span-1 glass-panel rounded-3xl p-4 bg-cyber-bg/40 flex flex-col overflow-y-auto border-cyber-border h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Dev Spaces</h2>
          <button
            onClick={() => setIsCreateSpaceOpen(true)}
            className="p-1.5 rounded-lg bg-cyber-hover hover:bg-cyber-accent hover:text-cyber-bg text-cyber-accent transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-2 flex-1">
          {communities.map((comm) => {
            const isSelected = activeCommData?._id === comm._id;
            const isMember = comm.members.includes(user._id);

            return (
              <div
                key={comm._id}
                className={`w-full rounded-2xl p-3 border text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-cyber-accent bg-cyber-accent/10'
                    : 'border-cyber-border hover:border-cyber-gray hover:bg-cyber-hover/20'
                }`}
              >
                <div className="cursor-pointer" onClick={() => handleSelectCommunity(comm)}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-bold text-white truncate max-w-[120px]">{comm.name}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple font-mono uppercase">
                      {comm.topic}
                    </span>
                  </div>
                  <p className="text-[10px] text-cyber-gray line-clamp-2 mb-2 font-mono">{comm.description}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-cyber-border/40">
                  <span className="text-[9px] text-cyber-gray font-mono flex items-center gap-1">
                    <Users size={10} /> {comm.members.length} peers
                  </span>
                  <button
                    onClick={() => handleJoinLeave(comm)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all duration-300 font-mono ${
                      isMember
                        ? 'bg-red-950/20 text-red-400 hover:bg-red-500 hover:text-white'
                        : 'bg-cyber-accent/15 text-cyber-accent hover:bg-cyber-accent hover:text-cyber-bg'
                    }`}
                  >
                    {isMember ? '[Leave]' : '[Join]'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Area: Space feed & discussions */}
      <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
        {activeCommData ? (
          <div className="flex-1 flex flex-col h-full bg-cyber-bg/20 rounded-3xl border border-cyber-border overflow-hidden">
            {/* Header info */}
            <div className="p-6 border-b border-cyber-border glass-panel bg-opacity-40 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">{activeCommData.name}</h2>
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20 font-mono">
                    {activeCommData.topic.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-cyber-gray mt-1 font-mono">{activeCommData.description}</p>
              </div>

              {activeCommData.members.includes(user._id) ? (
                <button
                  onClick={() => setIsNewPostOpen(true)}
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                >
                  <Plus size={14} /> New Thread
                </button>
              ) : (
                <button
                  onClick={() => handleJoinLeave(activeCommData)}
                  className="btn-primary py-2 px-5 text-xs font-mono"
                >
                  Join Space to Transmit
                </button>
              )}
            </div>

            {/* Posts feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {communityPosts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <MessageSquare size={36} className="text-cyber-border mx-auto" />
                  <p className="text-xs text-cyber-gray font-mono">Zero topics active in this channel. Launch a thread!</p>
                </div>
              ) : (
                communityPosts.map((post) => {
                  const hasLiked = post.likes.includes(user._id);
                  const isCommentsOpen = activeCommentsPostId === post._id;

                  return (
                    <div key={post._id} className="glass-card p-5 border-cyber-border bg-cyber-card/10 space-y-4">
                      {/* Author */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <img
                            src={post.user.profileImage || '/uploads/default-avatar.png'}
                            alt={post.user.username}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{post.user.username}</p>
                            <p className="text-[9px] text-cyber-gray font-mono">{new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-mono ${
                            post.difficulty === 'advanced'
                              ? 'bg-red-950/40 text-red-400 border border-red-900/40'
                              : post.difficulty === 'intermediate'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                          }`}>
                            {post.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white leading-snug">{post.title}</h3>
                        <p className="text-xs text-cyber-gray leading-relaxed">{post.content}</p>

                        {post.codeSnippet && (
                          <div className="font-mono text-left text-xs bg-black/60 rounded-xl p-3 border border-cyber-border overflow-x-auto space-y-1">
                            <span className="text-[9px] text-cyber-accent block border-b border-cyber-border/40 pb-1 mb-1.5 font-sans">
                              Code Block: {post.codeLanguage}
                            </span>
                            <pre className="text-white overflow-x-auto leading-5">{post.codeSnippet}</pre>
                          </div>
                        )}
                      </div>

                      {/* Interactive triggers */}
                      <div className="flex gap-4 border-t border-cyber-border/30 pt-3">
                        <button
                          onClick={() => dispatch(toggleLikeCommunityPost(post._id))}
                          className={`flex items-center gap-1.5 text-[10px] font-bold font-mono transition-colors ${
                            hasLiked ? 'text-cyber-pink' : 'text-cyber-gray hover:text-white'
                          }`}
                        >
                          <Heart size={14} className={hasLiked ? 'fill-current' : ''} /> {post.likes.length} Likes
                        </button>
                        <button
                          onClick={() => setActiveCommentsPostId(isCommentsOpen ? null : post._id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-cyber-gray hover:text-white transition-colors"
                        >
                          <MessageSquare size={14} /> {post.comments.length} Discussion Replies
                        </button>
                      </div>

                      {/* Discussion Comments Thread */}
                      {isCommentsOpen && (
                        <div className="mt-4 pt-4 border-t border-cyber-border/20 space-y-4">
                          {/* Replies list */}
                          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-2">
                            {post.comments.map((comm) => (
                              <div key={comm._id} className="flex gap-3 bg-cyber-bg/40 p-3 rounded-2xl border border-cyber-border/20">
                                <img
                                  src={comm.user.profileImage || '/uploads/default-avatar.png'}
                                  alt={comm.user.username}
                                  className="w-7 h-7 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] font-bold text-white">{comm.user.username}</span>
                                    <span className="text-[8px] text-cyber-gray font-mono">{new Date(comm.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-cyber-gray">{comm.text}</p>
                                  {comm.codeSnippet && (
                                    <div className="font-mono text-xs bg-black/60 rounded-xl p-2.5 border border-cyber-border/30 overflow-x-auto">
                                      <pre className="text-white">{comm.codeSnippet}</pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Write reply */}
                          {activeCommData.members.includes(user._id) && (
                            <div className="space-y-2 pt-2">
                              {showReplyCodeBox[post._id] && (
                                <div className="flex gap-4 items-center bg-cyber-bg border border-cyber-border rounded-xl p-2.5">
                                  <Code className="text-cyber-accent" size={14} />
                                  <span className="text-[10px] font-bold text-white font-mono flex-1">REPLY CODE ATTACHMENT</span>
                                  <select
                                    value={replyLang[post._id] || 'javascript'}
                                    onChange={(e) => setReplyLang({ ...replyLang, [post._id]: e.target.value })}
                                    className="text-[10px] bg-cyber-card border border-cyber-border text-white rounded px-2 py-0.5"
                                  >
                                    <option value="javascript">JS</option>
                                    <option value="python">PY</option>
                                    <option value="css">CSS</option>
                                  </select>
                                </div>
                              )}

                              {showReplyCodeBox[post._id] && (
                                <textarea
                                  placeholder="Write code snippet here..."
                                  rows={3}
                                  value={replyCode[post._id] || ''}
                                  onChange={(e) => setReplyCode({ ...replyCode, [post._id]: e.target.value })}
                                  className="w-full text-xs font-mono bg-cyber-bg border border-cyber-border rounded-xl p-2 text-white"
                                />
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowReplyCodeBox({ ...showReplyCodeBox, [post._id]: !showReplyCodeBox[post._id] })}
                                  className={`p-2.5 rounded-xl border transition-colors ${
                                    showReplyCodeBox[post._id]
                                      ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-accent'
                                      : 'border-cyber-border text-cyber-gray hover:text-white'
                                  }`}
                                  title="Attach Code"
                                >
                                  <Code size={14} />
                                </button>
                                <input
                                  type="text"
                                  placeholder="Formulate collaborative reply..."
                                  value={replyText[post._id] || ''}
                                  onChange={(e) => setReplyText({ ...replyText, [post._id]: e.target.value })}
                                  className="flex-1 text-xs"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddReply(post._id);
                                  }}
                                />
                                <button
                                  onClick={() => handleAddReply(post._id)}
                                  className="btn-primary py-2 px-4 text-[10px]"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-12 glass-panel border border-cyber-border rounded-3xl bg-cyber-bg/10 h-full">
            <div className="w-16 h-16 rounded-3xl bg-cyber-card border border-cyber-border flex items-center justify-center text-cyber-purple shadow-[0_0_15px_rgba(160,32,240,0.1)] mb-6 animate-pulse-glow">
              <Shield size={32} />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">Technical Mainframe Hub</h3>
            <p className="text-xs text-cyber-gray max-w-sm font-mono mb-4">
              Select or initialize a technical space workspace. Meet peers, discuss architecture patterns, and align logic.
            </p>
            <button
              onClick={() => setIsCreateSpaceOpen(true)}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-2"
            >
              <Plus size={14} /> Create Space
            </button>
          </div>
        )}
      </div>

      {/* Create Space Space Modal */}
      {isCreateSpaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 border-cyber-border shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-accent font-mono">Create Tech Space</h3>
              <button
                onClick={() => setIsCreateSpaceOpen(false)}
                className="text-cyber-gray hover:text-white"
              >
                [close]
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Space Name</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js Architects"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Description</label>
                <input
                  type="text"
                  placeholder="Share ideas on system designs..."
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Topic / Category</label>
                <select
                  value={spaceTopic}
                  onChange={(e) => setSpaceTopic(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 text-white"
                >
                  <option value="react">React</option>
                  <option value="nodejs">Node.js</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                  <option value="devops">DevOps</option>
                  <option value="web3">Web3</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateSpace}
              className="w-full btn-primary py-2.5 text-xs uppercase"
            >
              Launch Space Channels
            </button>
          </div>
        </div>
      )}

      {/* Create New Post modal */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border-cyber-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-accent font-mono">Launch Thread Post</h3>
              <button
                onClick={() => setIsNewPostOpen(false)}
                className="text-cyber-gray hover:text-white"
              >
                [close]
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Topic Difficulty</label>
                  <select
                    value={postDifficulty}
                    onChange={(e) => setPostDifficulty(e.target.value)}
                    className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2 text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Syntax Highlight</label>
                  <select
                    value={postLang}
                    onChange={(e) => setPostLang(e.target.value)}
                    className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2 text-white"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Topic Title</label>
                <input
                  type="text"
                  placeholder="e.g. Memory leaks in react useEffect hook"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Explain context</label>
                <textarea
                  placeholder="Describe your reasoning, setup configurations..."
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl p-3 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Attach Code Snippet (Optional)</label>
                <textarea
                  placeholder="Paste your source snippets here..."
                  rows={4}
                  value={postCode}
                  onChange={(e) => setPostCode(e.target.value)}
                  className="w-full text-xs font-mono bg-cyber-bg border border-cyber-border rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <button
              onClick={handleCreatePost}
              className="w-full btn-primary py-2.5 text-xs uppercase"
            >
              Broadcast Thread Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
