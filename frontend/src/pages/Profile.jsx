import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchProfile, updateProfile, toggleFollowUser } from '../store/slices/userSlice';
import { fetchUserPosts, fetchSavedPosts } from '../store/slices/postSlice';
import { fetchCollections, deleteCollection } from '../store/slices/phaseTwoSlice';
import { Settings, Grid, FileVideo, Bookmark, Award, Edit2, X, Plus, AlertTriangle, Cpu } from 'lucide-react';

export default function Profile() {
  const { username } = useParams();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { profile, loading: profileLoading, error: profileError } = useSelector((state) => state.users);
  const { userPosts, savedPosts, loading: postsLoading } = useSelector((state) => state.posts);
  const { collections } = useSelector((state) => state.phaseTwo);

  const [activeTab, setActiveTab] = useState('posts'); // posts, reels, saved
  const [selectedCollectionId, setSelectedCollectionId] = useState('all');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit profile form state
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updating, setUpdating] = useState(false);

  const isOwnProfile = user && user.username === username;
  const isFollowing = profile && profile.followers.some(f => f._id === user?._id);

  useEffect(() => {
    dispatch(fetchProfile(username));
    dispatch(fetchUserPosts(username));
    if (isOwnProfile) {
      dispatch(fetchSavedPosts(1));
      dispatch(fetchCollections());
    }
  }, [username, dispatch, isOwnProfile]);

  // Open edit profile settings
  const openEditModal = () => {
    if (profile) {
      setBio(profile.bio || '');
      setSkills(profile.skills?.join(', ') || '');
      setAvatarFile(null);
      setAvatarPreview(profile.profileImage || '');
      setUpdateError('');
      setIsEditOpen(true);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUpdateError('Avatar size must be less than 10MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdating(true);

    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('skills', skills);
    if (avatarFile) {
      formData.append('profileImage', avatarFile);
    }

    const result = await dispatch(updateProfile(formData));
    setUpdating(false);
    if (updateProfile.fulfilled.match(result)) {
      setIsEditOpen(false);
      dispatch(fetchProfile(username)); // Re-sync profile
    } else {
      setUpdateError(result.payload || 'Failed to update profile');
    }
  };

  const handleFollowToggle = () => {
    if (profile) {
      dispatch(toggleFollowUser(profile._id));
    }
  };

  // Filters posts for Reels tab (only video uploads)
  const reelsPosts = userPosts.filter(p => p.mediaType === 'video');

  if (profileLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-cyber-gray font-mono">Retrieving developer profile...</span>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="glass-card p-8 text-center max-w-md mx-auto mt-12 flex flex-col items-center gap-4">
        <AlertTriangle className="text-red-400" size={32} />
        <h3 className="text-lg font-bold text-white">Mainframe Error</h3>
        <p className="text-cyber-gray text-sm">
          {profileError || 'Developer profile could not be loaded. Confirm the handle exists.'}
        </p>
        <Link to="/" className="btn-primary py-2 px-5 text-xs font-bold">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8 border-cyber-border relative overflow-hidden bg-gradient-to-br from-cyber-card/60 via-cyber-card/30 to-cyber-bg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-accent via-cyber-purple to-cyber-pink" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Avatar */}
          <div className="relative group">
            <img
              src={profile.profileImage}
              onError={(e) => {
                e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.username;
              }}
              alt={profile.username}
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border border-cyber-border bg-cyber-bg shadow-xl"
            />
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                  {profile.username}
                  <Cpu size={16} className="text-cyber-accent" />
                </h1>
                <p className="text-xs text-cyber-gray font-mono mt-0.5">{profile.email}</p>
              </div>

              {/* Header Action Button */}
              <div>
                {isOwnProfile ? (
                  <button
                    onClick={openEditModal}
                    className="btn-secondary py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 w-full md:w-auto"
                  >
                    <Settings size={14} />
                    <span>Configure Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    className={`w-full md:w-auto py-2 px-5 rounded-xl font-bold text-xs transition-all duration-300 ${
                      isFollowing
                        ? 'border border-cyber-border text-white hover:bg-red-950/20 hover:text-red-400 hover:border-red-500/25'
                        : 'bg-gradient-to-r from-cyber-accent to-cyber-purple text-cyber-bg font-extrabold hover:shadow-lg'
                    }`}
                  >
                    {isFollowing ? 'Sever Connection' : 'Sync Creator'}
                  </button>
                )}
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="flex justify-center md:justify-start items-center gap-6 border-t border-b border-cyber-border/40 py-2.5 font-mono text-xs">
              <div>
                <span className="font-bold text-white text-sm">{profile.postsCount}</span>{' '}
                <span className="text-cyber-gray">posts</span>
              </div>
              <div>
                <span className="font-bold text-white text-sm">{profile.followersCount}</span>{' '}
                <span className="text-cyber-gray">followers</span>
              </div>
              <div>
                <span className="font-bold text-white text-sm">{profile.followingCount}</span>{' '}
                <span className="text-cyber-gray">following</span>
              </div>
            </div>

            {/* Biography */}
            {profile.bio && (
              <div className="text-sm bg-cyber-bg/40 border border-cyber-border/25 rounded-xl p-3 text-left">
                <span className="block text-[10px] uppercase font-bold text-cyber-gray tracking-wider mb-1 font-mono">Bio Log</span>
                <p className="text-gray-200 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Skills chip index */}
            <div className="space-y-1.5 text-left">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-cyber-accent tracking-wider font-mono">
                <Award size={12} /> Tech Stack:
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                {profile.skills?.length === 0 ? (
                  <span className="text-xs text-cyber-gray font-mono italic">No skills listed yet</span>
                ) : (
                  profile.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs font-mono font-semibold bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/20 rounded"
                    >
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex justify-center border-b border-cyber-border/50 text-sm font-semibold">
          {[
            { id: 'posts', label: 'Posts', icon: Grid },
            { id: 'reels', label: 'Reels', icon: FileVideo },
            ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: Bookmark }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyber-accent text-cyber-accent'
                    : 'border-transparent text-cyber-gray hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content grids */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {postsLoading && userPosts.length === 0 ? (
              <div className="col-span-full text-center py-10 text-cyber-gray font-mono text-xs">Querying posts...</div>
            ) : userPosts.length === 0 ? (
              <div className="col-span-full text-center py-12 glass-card p-6 border-cyber-border text-cyber-gray text-sm">
                No technical posts published yet.
              </div>
            ) : (
              userPosts.map((post) => (
                <div key={post._id} className="relative aspect-square rounded-xl overflow-hidden border border-cyber-border group bg-black">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={post.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  {/* Grid Hover info */}
                  <Link to="/" className="absolute inset-0 bg-cyber-bg/85 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300 gap-1.5 p-3">
                    <p className="text-xs font-mono font-semibold line-clamp-3 text-center text-cyber-accent">"{post.caption}"</p>
                    <p className="text-[10px] text-cyber-gray font-mono">{post.likes?.length || 0} commits / {post.comments?.length || 0} comments</p>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {reelsPosts.length === 0 ? (
              <div className="col-span-full text-center py-12 glass-card p-6 border-cyber-border text-cyber-gray text-sm">
                No technical video reels uploaded.
              </div>
            ) : (
              reelsPosts.map((post) => (
                <div key={post._id} className="relative aspect-square rounded-xl overflow-hidden border border-cyber-border group bg-black">
                  <video src={post.mediaUrl} className="w-full h-full object-cover" />
                  <Link to="/" className="absolute inset-0 bg-cyber-bg/85 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300 gap-1.5 p-3">
                    <p className="text-xs font-mono font-semibold line-clamp-3 text-center text-cyber-accent">"{post.caption}"</p>
                    <p className="text-[10px] text-cyber-gray font-mono">{post.likes?.length || 0} commits</p>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && isOwnProfile && (
          <div className="space-y-6">
            {/* Collections selector bar */}
            <div className="flex flex-wrap gap-2.5 items-center pb-4 border-b border-cyber-border/40">
              <button
                onClick={() => setSelectedCollectionId('all')}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all duration-300 ${
                  selectedCollectionId === 'all'
                    ? 'bg-cyber-accent text-cyber-bg'
                    : 'bg-cyber-card border border-cyber-border text-cyber-gray hover:text-white'
                }`}
              >
                All Bookmarks
              </button>

              {collections.map((coll) => (
                <div key={coll._id} className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedCollectionId(coll._id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all duration-300 ${
                      selectedCollectionId === coll._id
                        ? 'bg-cyber-accent text-cyber-bg'
                        : 'bg-cyber-card border border-cyber-border text-cyber-gray hover:text-white'
                    }`}
                  >
                    {coll.name} ({coll.posts?.length || 0})
                  </button>
                  {selectedCollectionId === coll._id && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this collection?')) {
                          dispatch(deleteCollection(coll._id)).then(() => setSelectedCollectionId('all'));
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete Collection Folder"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(() => {
                const currentPosts = selectedCollectionId === 'all'
                  ? savedPosts
                  : collections.find(c => c._id === selectedCollectionId)?.posts || [];

                if (currentPosts.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12 glass-card p-6 border-cyber-border text-cyber-gray text-sm font-mono">
                      No bookmarks saved in this workspace.
                    </div>
                  );
                }

                return currentPosts.map((post) => (
                  <div key={post._id} className="relative aspect-square rounded-xl overflow-hidden border border-cyber-border group bg-black">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                    <Link to="/" className="absolute inset-0 bg-cyber-bg/85 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300 gap-1.5 p-3">
                      <p className="text-xs font-mono font-bold text-cyber-accent">@{post.user?.username || 'Creator'}</p>
                      <p className="text-[10px] text-cyber-gray font-mono text-center line-clamp-2">"{post.caption}"</p>
                    </Link>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Configuration Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-cyber-bg/80 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="glass-card w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border-cyber-border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border/60 bg-cyber-card bg-opacity-50">
              <span className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                System Profile Config
              </span>
              <button onClick={() => setIsEditOpen(false)} className="text-cyber-gray hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="overflow-y-auto p-6 space-y-5">
              {updateError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <span>{updateError}</span>
                </div>
              )}

              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-3">
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-2xl object-cover border border-cyber-accent bg-cyber-bg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-cyber-accent hover:underline font-mono"
                >
                  Upload New Chip / Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-1.5">
                  Developer Bio (Max 150 chars)
                </label>
                <textarea
                  rows={3}
                  className="w-full text-sm leading-relaxed"
                  placeholder="Insert developer description..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={150}
                />
              </div>

              {/* Skills Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-1.5">
                  Tech Skillset (Comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full text-sm font-mono"
                  placeholder="React, Node.js, AWS, Kubernetes"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end border-t border-cyber-border/40 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Apply Settings'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
