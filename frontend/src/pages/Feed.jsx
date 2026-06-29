import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed, resetFeed } from '../store/slices/postSlice';
import PostCard from '../components/PostCard';
import { Terminal, Layers, RefreshCw, Cpu, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Feed() {
  const dispatch = useDispatch();
  const { feed, page, hasMore, loading, error } = useSelector((state) => state.posts);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(resetFeed());
    dispatch(fetchFeed(1));
  }, [dispatch]);

  // Infinite Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        hasMore &&
        !loading
      ) {
        dispatch(fetchFeed(page + 1));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loading, dispatch]);

  const handleRefresh = () => {
    dispatch(resetFeed());
    dispatch(fetchFeed(1));
  };

  // Hardcoded tech creators suggestions
  const suggestions = [
    { username: 'dan_abramov', role: 'React Core Team', skills: ['React', 'JavaScript', 'Suspense'], avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dan' },
    { username: 'linus_torvalds', role: 'Linux Creator', skills: ['C', 'Git', 'Kernel', 'C++'], avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=linus' },
    { username: 'guido_van_rossum', role: 'Python Creator', skills: ['Python', 'C', 'API Design'], avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=guido' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Feed Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Banner header info */}
        <div className="glass-card p-5 flex items-center justify-between border-cyber-border bg-cyber-card/10">
          <div className="flex items-center gap-3">
            <Cpu className="text-cyber-accent animate-pulse-glow" size={24} />
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Dev Mainframe Feed</h2>
              <p className="text-xs text-cyber-gray">Streaming technical updates in real-time</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl text-cyber-gray hover:text-cyber-accent hover:bg-cyber-hover transition-all"
            title="Refresh Feed"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {feed.length === 0 && !loading ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
            <Layers size={48} className="text-cyber-border" />
            <h3 className="text-lg font-bold text-white">Your Feed is Offline</h3>
            <p className="text-cyber-gray text-sm max-w-sm">
              Follow some technical creators, search skills, or publish your own educational posts to launch the mainframe feed!
            </p>
            <button
              onClick={handleRefresh}
              className="btn-primary py-2 px-5 text-xs font-bold"
            >
              Scan for Posts
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {feed.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center py-6 gap-3">
            <div className="w-6 h-6 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-cyber-gray font-mono">Streaming chunks...</span>
          </div>
        )}

        {/* No More Posts message */}
        {!hasMore && feed.length > 0 && (
          <p className="text-center text-xs text-cyber-gray font-mono py-8">
            --- End of stream. Mainframe fully loaded. ---
          </p>
        )}
      </div>

      {/* Suggested Creators Sidebar Column (>= lg) */}
      <div className="hidden lg:block space-y-6 sticky top-24 self-start">
        {/* Suggested Creators Panel */}
        <div className="glass-card p-5 border-cyber-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-accent mb-4 flex items-center gap-2">
            <Award size={16} /> Recommended Creators
          </h3>
          <div className="space-y-4">
            {suggestions.map((sug) => (
              <div key={sug.username} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <img
                    src={sug.avatar}
                    alt={sug.username}
                    className="w-9 h-9 rounded-xl border border-cyber-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white hover:text-cyber-accent transition-colors truncate">
                      {sug.username}
                    </p>
                    <p className="text-[10px] text-cyber-gray truncate">{sug.role}</p>
                  </div>
                </div>
                <Link
                  to={`/profile/${sug.username}`}
                  className="text-[10px] font-bold px-2.5 py-1 rounded bg-cyber-hover hover:bg-cyber-accent hover:text-cyber-bg text-cyber-accent transition-colors font-mono"
                >
                  inspect
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* User Stats Card */}
        <div className="glass-card p-5 border-cyber-border/60 bg-gradient-to-tr from-cyber-card/40 to-cyber-bg">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="text-cyber-accent" size={16} />
            <span className="text-xs font-bold uppercase text-white font-mono">Local Console</span>
          </div>
          <div className="space-y-1.5 text-xs text-cyber-gray font-mono">
            <div className="flex justify-between">
              <span>Node Environment:</span>
              <span className="text-white">development</span>
            </div>
            <div className="flex justify-between">
              <span>Active User:</span>
              <span className="text-cyber-accent">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-400">Authenticated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
