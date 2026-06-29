import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleLike, toggleSave, addComment, deletePost, editPost } from '../store/slices/postSlice';
import { fetchCollections, createCollection, togglePostInCollection } from '../store/slices/phaseTwoSlice';
import { Heart, MessageSquare, Bookmark, Share2, Trash2, Edit3, Send, Terminal, Code, Award, Check } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

export default function PostCard({ post }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);
  const [likeHeartPulse, setLikeHeartPulse] = useState(false);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { collections } = useSelector((state) => state.phaseTwo);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);

  const isLiked = post.likes?.includes(user?._id);
  const isSaved = post.saves?.includes(user?._id);
  const isOwner = post.user?._id === user?._id;

  const handleLike = () => {
    dispatch(toggleLike(post._id));
    if (!isLiked) {
      setLikeHeartPulse(true);
      setTimeout(() => setLikeHeartPulse(false), 800);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    } else {
      setLikeHeartPulse(true);
      setTimeout(() => setLikeHeartPulse(false), 800);
    }
  };

  const handleSave = () => {
    dispatch(toggleSave(post._id));
    if (!isSaved) {
      dispatch(fetchCollections());
      setIsCollectionsModalOpen(true);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    dispatch(addComment({ id: post._id, text: commentText }));
    setCommentText('');
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/profile/${post.user?.username}`;
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this technical post?')) {
      dispatch(deletePost(post._id));
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    dispatch(editPost({ id: post._id, caption: editCaption }));
    setIsEditing(false);
  };

  return (
    <article className="glass-card mb-8 overflow-hidden relative border-cyber-border">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b border-cyber-border/40 bg-cyber-card/20">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user?.username}`}>
            <img
              src={post.user?.profileImage || '/uploads/default-avatar.png'}
              onError={(e) => {
                e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.user?.username;
              }}
              alt={post.user?.username}
              className="w-10 h-10 rounded-xl object-cover border border-cyber-border"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.user?.username}`} className="font-bold text-white hover:text-cyber-accent text-sm transition-colors">
                {post.user?.username}
              </Link>
              {post.user?.skills?.[0] && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/20">
                  {post.user.skills[0]}
                </span>
              )}
            </div>
            <p className="text-[10px] text-cyber-gray font-mono mt-0.5">
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Post Actions (Edit/Delete) */}
        {isOwner && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-cyber-gray hover:text-cyber-accent rounded-xl hover:bg-cyber-hover transition-colors"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-cyber-gray hover:text-red-400 rounded-xl hover:bg-red-950/20 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Post Media Container with Double Tap to Like */}
      <div className="relative bg-black flex items-center justify-center select-none" onDoubleClick={handleDoubleTap}>
        {post.mediaType === 'video' ? (
          <VideoPlayer src={post.mediaUrl} />
        ) : (
          <img src={post.mediaUrl} alt="Techiegram content" className="w-full max-h-[500px] object-contain" />
        )}

        {/* Big Heart Overlay Animation */}
        {likeHeartPulse && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/10">
            <Heart size={80} className="fill-cyber-pink text-cyber-pink animate-ping scale-110 opacity-75" />
          </div>
        )}
      </div>

      {/* Interactive Icons Bar */}
      <div className="p-4 flex items-center justify-between border-t border-cyber-border/40">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`p-2 rounded-xl hover:bg-cyber-hover transition-all ${
              isLiked ? 'text-cyber-pink scale-110' : 'text-cyber-gray hover:text-white'
            }`}
          >
            <Heart size={22} className={isLiked ? 'fill-cyber-pink' : ''} />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`p-2 rounded-xl hover:bg-cyber-hover transition-all ${
              showComments ? 'text-cyber-accent scale-110' : 'text-cyber-gray hover:text-white'
            }`}
          >
            <MessageSquare size={22} />
          </button>
          <button
            onClick={handleShare}
            className={`p-2 rounded-xl hover:bg-cyber-hover transition-all text-cyber-gray hover:text-white relative`}
          >
            {copied ? <Check size={22} className="text-emerald-400" /> : <Share2 size={22} />}
            {copied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-mono whitespace-nowrap animate-fade-in">
                Copied Link!
              </span>
            )}
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`p-2 rounded-xl hover:bg-cyber-hover transition-all ${
            isSaved ? 'text-cyber-accent scale-110' : 'text-cyber-gray hover:text-white'
          }`}
        >
          <Bookmark size={22} className={isSaved ? 'fill-cyber-accent' : ''} />
        </button>
      </div>

      {/* Info Panel: Likes & Description */}
      <div className="px-5 pb-4 space-y-2">
        <p className="text-xs font-bold text-white font-mono">
          {post.likes?.length || 0} commit{(post.likes?.length !== 1) && 's'} / like{(post.likes?.length !== 1) && 's'}
        </p>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-3 mt-2 animate-fade-in">
            <textarea
              className="w-full resize-none font-mono text-sm"
              rows={3}
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary py-1.5 px-3 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary py-1.5 px-4 text-xs font-bold"
              >
                Update
              </button>
            </div>
          </form>
        ) : (
          post.caption && (
            <div className="text-sm leading-relaxed text-gray-200">
              <span className="font-bold text-white mr-2">{post.user?.username}</span>
              <span className="whitespace-pre-line font-sans">{post.caption}</span>
            </div>
          )
        )}

        {/* Display hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-xs font-mono text-cyber-accent hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="border-t border-cyber-border/40 bg-cyber-bg/40 px-5 py-4 space-y-4 animate-slide-up">
          <span className="text-[11px] font-bold text-cyber-gray uppercase tracking-wider font-mono">
            Terminal Comments ({post.comments?.length || 0})
          </span>

          {/* List of comments */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {post.comments?.length === 0 ? (
              <p className="text-xs text-cyber-gray font-mono italic">No logs found on this thread. Post a comment!</p>
            ) : (
              post.comments.map((comm) => (
                <div key={comm._id} className="flex items-start gap-2.5 text-xs text-gray-300">
                  <img
                    src={comm.user?.profileImage || '/uploads/default-avatar.png'}
                    onError={(e) => {
                      e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + comm.user?.username;
                    }}
                    alt={comm.user?.username}
                    className="w-6 h-6 rounded-md object-cover border border-cyber-border mt-0.5"
                  />
                  <div className="flex-1 bg-cyber-card/30 border border-cyber-border/30 rounded-xl px-3 py-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">{comm.user?.username}</span>
                      <span className="text-[9px] text-cyber-gray font-mono">
                        {new Date(comm.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="font-sans leading-relaxed text-gray-200">{comm.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New comment input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
            <input
              type="text"
              required
              placeholder="Inject comment logic..."
              className="flex-1 py-2 text-xs font-mono"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-cyber-accent text-cyber-bg hover:scale-105 transition-transform"
            >
              <Send size={14} className="stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}
      {/* Bookmark Collections Organizer Modal */}
      {isCollectionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="glass-panel max-w-sm w-full rounded-2xl p-5 border-cyber-border text-left space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Organize Bookmarks</h4>
              <button
                onClick={() => setIsCollectionsModalOpen(false)}
                className="text-cyber-gray hover:text-white font-bold"
              >
                [close]
              </button>
            </div>

            <p className="text-[10px] text-cyber-gray font-mono">
              Add this technical post to one or more learning collections:
            </p>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {collections.map((coll) => {
                const isSelected = coll.posts?.some(p => p._id === post._id || p === post._id);
                return (
                  <label
                    key={coll._id}
                    className="flex items-center justify-between p-2 rounded-xl bg-cyber-hover/20 hover:bg-cyber-hover border border-cyber-border/40 cursor-pointer"
                  >
                    <span className="text-xs text-white">{coll.name}</span>
                    <input
                      type="checkbox"
                      checked={isSelected || false}
                      onChange={() => dispatch(togglePostInCollection({ collId: coll._id, postId: post._id }))}
                      className="accent-cyber-accent rounded border-cyber-border focus:ring-0"
                    />
                  </label>
                );
              })}
            </div>

            {/* Create Collection Inline Form */}
            <div className="space-y-1.5 pt-2 border-t border-cyber-border/40">
              <label className="text-[9px] uppercase font-bold text-cyber-gray font-mono">New Collection</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Next.js tips"
                  id={`new-coll-name-${post._id}`}
                  className="flex-1 text-[11px] px-2.5 py-1.5 bg-cyber-bg/60 border border-cyber-border rounded-xl text-white focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.target.value;
                      if (val.trim()) {
                        dispatch(createCollection(val.trim())).then(() => {
                          e.target.value = '';
                          dispatch(fetchCollections());
                        });
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById(`new-coll-name-${post._id}`);
                    const val = el ? el.value : '';
                    if (val.trim()) {
                      dispatch(createCollection(val.trim())).then(() => {
                        if (el) el.value = '';
                        dispatch(fetchCollections());
                      });
                    }
                  }}
                  className="btn-primary py-1 px-3 text-[10px]"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
