import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { executeSearch, resetSearch } from '../store/slices/userSlice';
import { executeAdvancedSearch } from '../store/slices/phaseTwoSlice';
import { X, Search, User, Tag, Terminal, Layers } from 'lucide-react';

export default function SearchDrawer({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // users, skills, posts

  // Advanced States
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [techFilter, setTechFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [hasRunAdvanced, setHasRunAdvanced] = useState(false);

  const dispatch = useDispatch();
  const { searchResults, searchLoading } = useSelector((state) => state.users);
  const { advancedSearchResults, loading: advancedLoading } = useSelector((state) => state.phaseTwo);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setTechFilter('');
      setDifficultyFilter('');
      setCreatorFilter('');
      setTypeFilter('all');
      setHasRunAdvanced(false);
      dispatch(resetSearch());
    }
  }, [isOpen, dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasRunAdvanced(false);
    dispatch(executeSearch(query));
  };

  const handleAdvancedSearchSubmit = (e) => {
    e.preventDefault();
    setHasRunAdvanced(true);
    dispatch(executeAdvancedSearch({
      tech: techFilter || undefined,
      difficulty: difficultyFilter || undefined,
      creator: creatorFilter || undefined,
      type: typeFilter
    }));
  };

  // Live search as user types
  useEffect(() => {
    if (!isAdvanced) {
      const delayDebounceFn = setTimeout(() => {
        if (query.trim()) {
          dispatch(executeSearch(query));
        } else {
          dispatch(resetSearch());
        }
      }, 400);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [query, isAdvanced, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-cyber-bg/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-md bg-cyber-card border-r border-cyber-border h-full flex flex-col z-10 shadow-2xl animate-slide-in-right md:animate-none">
        {/* Header */}
        <div className="p-6 border-b border-cyber-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="text-cyber-accent" size={18} />
            <span className="font-bold text-white uppercase text-sm tracking-wider font-mono">
              Search Console
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cyber-gray hover:text-white hover:bg-cyber-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="px-6 py-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder={isAdvanced ? "Advanced Search Active..." : "Query usernames, skillsets, tags..."}
              disabled={isAdvanced}
              className="w-full pl-10 disabled:opacity-50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 text-cyber-gray" size={16} />
          </form>
        </div>

        {/* Toggle Advanced Filters */}
        <div className="px-6 pb-2">
          <button
            onClick={() => {
              setIsAdvanced(!isAdvanced);
              if (isAdvanced) {
                setHasRunAdvanced(false);
              }
            }}
            className="text-[10px] font-bold text-cyber-accent uppercase font-mono hover:underline flex items-center gap-1.5"
          >
            {isAdvanced ? '[-] Standard Search Console' : '[+] Advanced Filters Query Builder'}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {isAdvanced && (
          <form onSubmit={handleAdvancedSearchSubmit} className="px-6 py-4 border-b border-cyber-border/40 bg-cyber-hover/10 space-y-3.5 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-cyber-gray font-mono">Topic Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-2.5 py-1.5 text-white"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-cyber-gray font-mono">Category Workspace</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-2.5 py-1.5 text-white"
                >
                  <option value="all">All Items</option>
                  <option value="posts">Reels/Posts</option>
                  <option value="questions">Q&A threads</option>
                  <option value="communities">Spaces</option>
                  <option value="users">Users</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-cyber-gray font-mono">Creator Username</label>
                <input
                  type="text"
                  placeholder="e.g. dan_abramov"
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-2.5 py-1.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-cyber-gray font-mono">Topic / Technology</label>
                <input
                  type="text"
                  placeholder="e.g. python, react"
                  value={techFilter}
                  onChange={(e) => setTechFilter(e.target.value)}
                  className="w-full text-xs bg-cyber-bg border border-cyber-border rounded-xl px-2.5 py-1.5"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-2 text-xs uppercase tracking-wider font-mono font-bold"
            >
              Execute Filter Matrix
            </button>
          </form>
        )}

        {/* Search Results Navigation (Only for Standard) */}
        {!isAdvanced && (
          <div className="px-6 flex border-b border-cyber-border/40 text-sm font-semibold">
            {[
              { id: 'users', label: 'Users', count: searchResults?.users?.length },
              { id: 'skills', label: 'By Skill', count: searchResults?.skills?.length },
              { id: 'posts', label: 'By Tag', count: searchResults?.posts?.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-center border-b-2 transition-colors relative ${
                  activeTab === tab.id
                    ? 'border-cyber-accent text-cyber-accent'
                    : 'border-transparent text-cyber-gray hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-cyber-hover border border-cyber-border text-white font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchLoading || advancedLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-cyber-gray font-mono">Running query...</span>
            </div>
          ) : isAdvanced && !hasRunAdvanced ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-cyber-gray space-y-2 font-mono text-xs">
              <Layers size={36} className="text-cyber-border" />
              <p>Advanced Search Console Ready.</p>
              <p>Configure matrix inputs and execute search query.</p>
            </div>
          ) : isAdvanced && hasRunAdvanced ? (
            <div className="space-y-6">
              {/* 1. Posts results */}
              {(typeFilter === 'all' || typeFilter === 'posts') && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyber-accent font-mono border-b border-cyber-border/40 pb-1 mb-2">Reels/Posts ({advancedSearchResults.posts?.length || 0})</h4>
                  {advancedSearchResults.posts?.length === 0 ? (
                    <p className="text-[10px] text-cyber-gray font-mono italic">No posts found.</p>
                  ) : (
                    advancedSearchResults.posts?.map(post => (
                      <Link key={post._id} to={`/`} onClick={onClose} className="flex gap-3 p-2 hover:bg-cyber-hover/20 border border-cyber-border/40 rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded bg-black overflow-hidden flex-shrink-0 flex items-center justify-center border border-cyber-border">
                          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">@{post.user?.username}</p>
                          <p className="text-[10px] text-cyber-gray truncate font-mono">"{post.caption}"</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* 2. Questions results */}
              {(typeFilter === 'all' || typeFilter === 'questions') && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyber-accent font-mono border-b border-cyber-border/40 pb-1 mb-2">Mentor Q&A ({advancedSearchResults.questions?.length || 0})</h4>
                  {advancedSearchResults.questions?.length === 0 ? (
                    <p className="text-[10px] text-cyber-gray font-mono italic">No questions found.</p>
                  ) : (
                    advancedSearchResults.questions?.map(q => (
                      <Link key={q._id} to={`/mentors`} onClick={onClose} className="block p-2 hover:bg-cyber-hover/20 border border-cyber-border/40 rounded-xl transition-colors">
                        <p className="text-xs font-bold text-white truncate">{q.title}</p>
                        <p className="text-[10px] text-cyber-gray truncate font-mono">Difficulty: {q.difficulty} / Tech: {q.technology}</p>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* 3. Communities results */}
              {(typeFilter === 'all' || typeFilter === 'communities') && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyber-accent font-mono border-b border-cyber-border/40 pb-1 mb-2">Spaces ({advancedSearchResults.communities?.length || 0})</h4>
                  {advancedSearchResults.communities?.length === 0 ? (
                    <p className="text-[10px] text-cyber-gray font-mono italic">No communities found.</p>
                  ) : (
                    advancedSearchResults.communities?.map(comm => (
                      <Link key={comm._id} to={`/communities`} onClick={onClose} className="block p-2 hover:bg-cyber-hover/20 border border-cyber-border/40 rounded-xl transition-colors">
                        <p className="text-xs font-bold text-white truncate">{comm.name}</p>
                        <p className="text-[10px] text-cyber-gray truncate font-mono">Topic: {comm.topic}</p>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* 4. Users results */}
              {(typeFilter === 'all' || typeFilter === 'users') && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyber-accent font-mono border-b border-cyber-border/40 pb-1 mb-2">Users ({advancedSearchResults.users?.length || 0})</h4>
                  {advancedSearchResults.users?.length === 0 ? (
                    <p className="text-[10px] text-cyber-gray font-mono italic">No users found.</p>
                  ) : (
                    advancedSearchResults.users?.map(usr => (
                      <Link key={usr._id} to={`/profile/${usr.username}`} onClick={onClose} className="flex gap-2.5 items-center p-2 hover:bg-cyber-hover/20 border border-cyber-border/40 rounded-xl transition-colors">
                        <img src={usr.profileImage} alt="" className="w-8 h-8 rounded-lg object-cover border border-cyber-border" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{usr.username}</p>
                          <p className="text-[10px] text-cyber-gray truncate font-mono">{usr.mentorTitle || usr.skills?.slice(0,2).join(', ')}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-cyber-gray space-y-2">
              <Layers size={36} className="text-cyber-border" />
              <p className="text-sm">Enter search parameters</p>
              <p className="text-xs font-mono">Ex: "#javascript", "python", "dan_abramov"</p>
            </div>
          ) : (
            <>
              {/* Tab: Users */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {searchResults?.users?.length === 0 ? (
                    <p className="text-sm text-cyber-gray text-center py-6 font-mono">No matching users</p>
                  ) : (
                    searchResults?.users?.map((usr) => (
                      <Link
                        key={usr._id}
                        to={`/profile/${usr.username}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl border border-cyber-border/40 hover:border-cyber-accent/30 hover:bg-cyber-hover/30 transition-all duration-300 group"
                      >
                        <img
                          src={usr.profileImage || '/uploads/default-avatar.png'}
                          onError={(e) => {
                            e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + usr.username;
                          }}
                          alt={usr.username}
                          className="w-10 h-10 rounded-xl object-cover border border-cyber-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-cyber-accent transition-colors truncate">
                            {usr.username}
                          </p>
                          <p className="text-xs text-cyber-gray truncate font-mono">
                            {usr.skills?.slice(0, 2).join(', ') || 'No skills set'}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Skills */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  {searchResults?.skills?.length === 0 ? (
                    <p className="text-sm text-cyber-gray text-center py-6 font-mono">No users match that skill</p>
                  ) : (
                    searchResults?.skills?.map((usr) => (
                      <Link
                        key={usr._id}
                        to={`/profile/${usr.username}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl border border-cyber-border/40 hover:border-cyber-accent/30 hover:bg-cyber-hover/30 transition-all duration-300 group"
                      >
                        <img
                          src={usr.profileImage || '/uploads/default-avatar.png'}
                          onError={(e) => {
                            e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + usr.username;
                          }}
                          alt={usr.username}
                          className="w-10 h-10 rounded-xl object-cover border border-cyber-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-cyber-accent transition-colors truncate">
                            {usr.username}
                          </p>
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {usr.skills?.map((skill, i) => (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                                  skill.toLowerCase().includes(query.toLowerCase())
                                    ? 'bg-cyber-accent/20 text-cyber-accent'
                                    : 'bg-cyber-hover text-cyber-gray'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Posts */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {searchResults?.posts?.length === 0 ? (
                    <p className="text-sm text-cyber-gray text-center py-6 font-mono">No posts found with hashtag</p>
                  ) : (
                    searchResults?.posts?.map((post) => (
                      <Link
                        key={post._id}
                        to={`/`}
                        onClick={onClose}
                        className="flex gap-3 p-3 rounded-xl border border-cyber-border/40 hover:border-cyber-accent/30 hover:bg-cyber-hover/30 transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-cyber-border flex-shrink-0 bg-cyber-bg flex items-center justify-center">
                          {post.mediaType === 'video' ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                              <video src={post.mediaUrl} className="w-full h-full object-cover opacity-50" />
                              <Layers size={14} className="absolute text-white" />
                            </div>
                          ) : (
                            <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">{post.user?.username}</span>
                          </div>
                          <p className="text-xs text-cyber-gray truncate font-mono mt-1">
                            {post.caption || 'No caption'}
                          </p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {post.hashtags?.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[10px] text-cyber-accent font-mono">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
