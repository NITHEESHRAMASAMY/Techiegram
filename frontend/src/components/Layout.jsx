import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  addNewNotification
} from '../store/slices/phaseTwoSlice';
import { getSocket } from '../utils/socket';
import {
  Home,
  Search,
  SquarePlus,
  User,
  LogOut,
  Terminal,
  MessageSquare,
  Users,
  Award,
  Bell,
  X,
  Menu
} from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import SearchDrawer from './SearchDrawer';

export default function Layout() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { notifications, notificationCount } = useSelector((state) => state.phaseTwo);

  // Load notifications initially
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  // Real-time socket notification listener
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('notification_received', (notif) => {
        dispatch(addNewNotification(notif));
      });
    }
    return () => {
      if (socket) {
        socket.off('notification_received');
      }
    };
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Chats', path: '/chats', icon: MessageSquare },
    { name: 'Spaces', path: '/communities', icon: Users },
    { name: 'Mentors', path: '/mentors', icon: Award },
    { name: 'Profile', path: `/profile/${user?.username}`, icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cyber-bg relative overflow-x-hidden">
      {/* Search Drawer Overlay */}
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Create Post Modal Overlay */}
      {isCreateOpen && (
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}

      {/* Desktop Left Sidebar (>= md) */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-cyber-border h-screen sticky top-0 px-4 py-6 z-20">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 px-3 mb-10">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-cyber-accent to-cyber-purple text-cyber-bg">
            <Terminal size={22} className="stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white font-mono">
            Techie<span className="text-gradient font-sans">gram</span>
          </span>
        </Link>

        {/* Navigation Routes */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyber-accent/15 to-cyber-purple/5 text-cyber-accent border-l-2 border-cyber-accent'
                    : 'text-cyber-gray hover:text-white hover:bg-cyber-hover/50'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-cyber-accent' : ''} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 w-full text-left ${
              isSearchOpen
                ? 'bg-gradient-to-r from-cyber-accent/15 to-cyber-purple/5 text-cyber-accent border-l-2 border-cyber-accent'
                : 'text-cyber-gray hover:text-white hover:bg-cyber-hover/50'
            }`}
          >
            <Search size={20} className={isSearchOpen ? 'text-cyber-accent' : ''} />
            <span>Search</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 w-full text-left relative ${
              isNotifOpen
                ? 'bg-gradient-to-r from-cyber-accent/15 to-cyber-purple/5 text-cyber-accent border-l-2 border-cyber-accent'
                : 'text-cyber-gray hover:text-white hover:bg-cyber-hover/50'
            }`}
          >
            <Bell size={20} className={isNotifOpen ? 'text-cyber-accent' : ''} />
            <span>Activity Logs</span>
            {notificationCount > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-cyber-pink text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Create Post Trigger */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm text-cyber-gray hover:text-white hover:bg-cyber-hover/50 transition-all duration-300 w-full text-left"
          >
            <SquarePlus size={20} />
            <span>Publish Post</span>
          </button>
        </nav>

        {/* Footer profile & logout */}
        <div className="border-t border-cyber-border/40 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <img
              src={user?.profileImage || '/uploads/default-avatar.png'}
              onError={(e) => {
                e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user?.username;
              }}
              alt={user?.username}
              className="w-10 h-10 rounded-xl object-cover border border-cyber-border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.username}</p>
              <p className="text-[11px] text-cyber-gray truncate font-mono">
                {user?.skills?.[0] || 'Junior Dev'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 font-semibold text-sm transition-all duration-300"
          >
            <LogOut size={20} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (< md) */}
      <header className="md:hidden flex items-center justify-between px-4 py-4 glass-panel border-b border-cyber-border sticky top-0 z-20 bg-cyber-bg bg-opacity-95">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyber-accent to-cyber-purple text-cyber-bg">
            <Terminal size={18} className="stroke-[2.5]" />
          </div>
          <span className="text-lg font-extrabold text-white font-mono">
            Techie<span className="text-gradient font-sans">gram</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-xl text-cyber-gray hover:text-white hover:bg-cyber-hover transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-cyber-gray hover:text-white hover:bg-cyber-hover transition-colors relative"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-cyber-pink rounded-full" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 md:h-screen md:overflow-y-auto px-4 py-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-cyber-border px-6 py-3 flex justify-between items-center z-20 shadow-2xl bg-cyber-bg bg-opacity-95">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`p-2 rounded-xl transition-colors ${
                isActive ? 'text-cyber-accent' : 'text-cyber-gray'
              }`}
            >
              <Icon size={22} />
            </Link>
          );
        })}
        <Link
          to={`/profile/${user?.username}`}
          className={`p-2 rounded-xl transition-colors ${
            location.pathname.startsWith('/profile') ? 'text-cyber-accent' : 'text-cyber-gray'
          }`}
        >
          <img
            src={user?.profileImage || '/uploads/default-avatar.png'}
            onError={(e) => {
              e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user?.username;
            }}
            alt={user?.username}
            className={`w-6 h-6 rounded-full object-cover border ${
              location.pathname.startsWith('/profile') ? 'border-cyber-accent' : 'border-cyber-border'
            }`}
          />
        </Link>
      </nav>

      {/* Sliding Glassmorphic Notifications Drawer */}
      {isNotifOpen && (
        <div className="fixed top-0 right-0 bottom-0 w-80 glass-panel border-l border-cyber-border z-40 flex flex-col p-4 bg-cyber-bg bg-opacity-95 shadow-2xl animate-slide-in-right">
          <div className="flex justify-between items-center pb-3 border-b border-cyber-border">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Bell size={14} className="text-cyber-accent" /> Developer Logs
            </h3>
            <button onClick={() => setIsNotifOpen(false)} className="text-cyber-gray hover:text-white font-mono text-[10px]">
              [close]
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between py-2 border-b border-cyber-border/40 text-[9px] font-mono">
            <button onClick={() => dispatch(markAllNotificationsAsRead())} className="text-cyber-accent hover:underline">
              [Mark All Read]
            </button>
            <button onClick={() => dispatch(clearAllNotifications())} className="text-red-400 hover:underline">
              [Clear All Logs]
            </button>
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto divide-y divide-cyber-border/20 py-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-cyber-gray text-center font-mono py-8">Zero logs recorded.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => {
                    dispatch(markNotificationAsRead(notif._id));
                    setIsNotifOpen(false);
                    // Routing redirections
                    if (notif.post) navigate(`/profile/${user.username}`);
                    if (notif.question) navigate(`/mentors`);
                  }}
                  className={`p-3 text-[10px] cursor-pointer hover:bg-cyber-hover/30 transition-colors ${
                    !notif.isRead ? 'bg-cyber-accent/5 border-l-2 border-cyber-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={notif.sender?.profileImage || '/uploads/default-avatar.png'}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-bold text-white">@{notif.sender?.username}</span>
                  </div>
                  <p className="text-cyber-gray leading-normal">{notif.commentText || 'interacted with your profile'}</p>
                  <span className="text-[8px] text-cyber-gray font-mono block mt-1">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
