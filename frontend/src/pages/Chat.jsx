import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchChats,
  accessChat,
  createGroupChat,
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  setActiveChat,
  addReceivedMessage,
  setTypingStatus,
  clearTypingStatus,
  updateUserPresence
} from '../store/slices/phaseTwoSlice';
import { initiateSocket, getSocket } from '../utils/socket';
import { Send, Users, Terminal, Code, MessageSquare, Shield, Check, CheckCheck } from 'lucide-react';

export default function Chat() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { chats, activeChat, messages, typingChatId, typingUser } = useSelector((state) => state.phaseTwo);

  // States
  const [inputText, setInputText] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Chats list
  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (activeChat) {
      dispatch(fetchMessages(activeChat._id));
      dispatch(markMessagesAsRead(activeChat._id));

      const socket = getSocket();
      if (socket) {
        socket.emit('join_chat', activeChat._id);
        socket.emit('message_read', { chatId: activeChat._id, userId: user._id });
      }
    }
  }, [activeChat, dispatch, user._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Socket event listeners mounting
  useEffect(() => {
    const socket = initiateSocket(token);

    socket.on('message_received', (msg) => {
      dispatch(addReceivedMessage(msg));
      if (activeChat && activeChat._id === msg.chat._id) {
        dispatch(markMessagesAsRead(activeChat._id));
        socket.emit('message_read', { chatId: activeChat._id, userId: user._id });
      }
    });

    socket.on('typing', (chatId) => {
      // Find sender username
      const targetChat = chats.find(c => c._id === chatId);
      if (targetChat) {
        dispatch(setTypingStatus({ chatId, username: 'Someone' }));
      }
    });

    socket.on('stop_typing', (chatId) => {
      dispatch(clearTypingStatus({ chatId }));
    });

    socket.on('message_read', ({ chatId, userId }) => {
      // Refresh current message read states
      if (activeChat && activeChat._id === chatId) {
        dispatch(fetchMessages(chatId));
      }
    });

    socket.on('user_status_change', ({ userId, status }) => {
      dispatch(updateUserPresence({ userId, status }));
    });

    return () => {
      socket.off('message_received');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('message_read');
      socket.off('user_status_change');
    };
  }, [token, activeChat, chats, dispatch, user._id]);

  // User search for new chat / group chat
  useEffect(() => {
    if (userSearchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const searchUsers = async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(userSearchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error(err);
      }
    };
    const delayDebounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(delayDebounce);
  }, [userSearchQuery, token]);

  // Handle typing event dispatching
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    const socket = getSocket();
    if (!socket || !activeChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', activeChat._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', activeChat._id);
      setIsTyping(false);
    }, 2000);
  };

  // Send message
  const handleSend = () => {
    if (inputText.trim() === '' && !isCodeMode) return;
    
    const payload = {
      content: inputText,
      chatId: activeChat._id,
      isCodeSnippet: isCodeMode,
      codeLanguage: isCodeMode ? codeLanguage : 'text',
    };

    dispatch(sendMessage(payload)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        const socket = getSocket();
        if (socket) {
          socket.emit('stop_typing', activeChat._id);
          setIsTyping(false);
          socket.emit('new_message', res.payload);
        }
        setInputText('');
        setIsCodeMode(false);
      }
    });
  };

  // Create chat or group chat
  const startDirectChat = (targetUser) => {
    dispatch(accessChat(targetUser._id));
    setUserSearchQuery('');
  };

  const handleCreateGroup = () => {
    if (groupName.trim() === '' || selectedUsers.length === 0) return;
    dispatch(createGroupChat({
      name: groupName,
      users: selectedUsers.map(u => u._id)
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setIsGroupModalOpen(false);
        setGroupName('');
        setSelectedUsers([]);
      }
    });
  };

  const toggleUserSelection = (targetUser) => {
    if (selectedUsers.some(u => u._id === targetUser._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== targetUser._id));
    } else {
      setSelectedUsers([...selectedUsers, targetUser]);
    }
  };

  // Chat Helpers
  const getChatPartner = (chat) => {
    if (!chat || chat.isGroupChat) return null;
    return chat.users.find(u => u._id !== user._id);
  };

  return (
    <div className="glass-panel rounded-3xl h-[80vh] flex overflow-hidden border-cyber-border">
      {/* Sidebar List */}
      <div className="w-80 border-r border-cyber-border flex flex-col bg-cyber-bg bg-opacity-40">
        {/* Search & Actions Header */}
        <div className="p-4 border-b border-cyber-border space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Mainframe Hub</h2>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="p-2 rounded-xl bg-cyber-hover hover:bg-cyber-accent hover:text-cyber-bg text-cyber-accent transition-all duration-300"
              title="Create Collaborative Group"
            >
              <Users size={16} />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search user to inspect..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full text-xs bg-cyber-bg/60 border border-cyber-border rounded-xl px-3 py-2 text-white placeholder-cyber-gray"
            />
            {/* User Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-panel border border-cyber-border rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto bg-cyber-card">
                {searchResults.map((usr) => (
                  <button
                    key={usr._id}
                    onClick={() => startDirectChat(usr)}
                    className="w-full text-left px-3 py-2.5 hover:bg-cyber-hover flex items-center gap-3 transition-colors border-b border-cyber-border/40 last:border-b-0"
                  >
                    <img
                      src={usr.profileImage || '/uploads/default-avatar.png'}
                      alt={usr.username}
                      className="w-7 h-7 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{usr.username}</p>
                      <p className="text-[10px] text-cyber-gray font-mono">{usr.skills?.[0] || 'Junior Dev'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-cyber-border/20">
          {chats.map((chat) => {
            const partner = getChatPartner(chat);
            const isActive = activeChat?._id === chat._id;
            const chatName = chat.isGroupChat ? chat.chatName : partner?.username;
            const avatar = chat.isGroupChat
              ? `https://api.dicebear.com/7.x/identicon/svg?seed=${chat._id}`
              : partner?.profileImage || '/uploads/default-avatar.png';
            const isOnline = partner?.onlineStatus === 'online';

            return (
              <button
                key={chat._id}
                onClick={() => dispatch(setActiveChat(chat))}
                className={`w-full flex items-center gap-3.5 px-4 py-4 text-left transition-all duration-300 ${
                  isActive ? 'bg-cyber-hover/60 border-l-4 border-cyber-accent' : 'hover:bg-cyber-hover/20'
                }`}
              >
                {/* Avatar with Status badge */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatar}
                    alt={chatName}
                    className="w-11 h-11 rounded-2xl object-cover border border-cyber-border"
                  />
                  {!chat.isGroupChat && isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-cyber-bg rounded-full animate-pulse" />
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-cyber-accent font-extrabold' : 'text-white'}`}>
                      {chatName}
                    </p>
                    <span className="text-[9px] text-cyber-gray font-mono">
                      {chat.latestMessage ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {typingChatId === chat._id ? (
                    <p className="text-[10px] text-cyber-accent animate-pulse font-mono">typing status active...</p>
                  ) : (
                    <p className="text-[10px] text-cyber-gray truncate font-mono">
                      {chat.latestMessage ? chat.latestMessage.content : 'No transmissions yet'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Workspace */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-cyber-bg bg-opacity-20 relative">
          {/* Active Chat Header */}
          <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between glass-panel bg-opacity-40">
            <div className="flex items-center gap-3">
              <img
                src={activeChat.isGroupChat ? `https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat._id}` : getChatPartner(activeChat)?.profileImage || '/uploads/default-avatar.png'}
                alt="Active Conversation"
                className="w-10 h-10 rounded-xl object-cover border border-cyber-border"
              />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {activeChat.isGroupChat ? activeChat.chatName : getChatPartner(activeChat)?.username}
                </h3>
                <p className="text-[10px] text-cyber-gray font-mono">
                  {activeChat.isGroupChat ? `${activeChat.users.length} coding collaborators` : getChatPartner(activeChat)?.onlineStatus === 'online' ? 'Status: ONLINE' : 'Status: OFFLINE'}
                </p>
              </div>
            </div>
            
            {activeChat.isGroupChat && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 font-mono text-[9px] uppercase">
                <Shield size={10} /> group thread
              </div>
            )}
          </div>

          {/* Messages Scroll Workspace */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isMine = msg.sender._id === user._id;
              const hasRead = msg.readBy && msg.readBy.length >= activeChat.users.length;
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] space-y-1 ${isMine ? 'text-right' : 'text-left'}`}>
                    {/* Message Details */}
                    {!isMine && (
                      <span className="text-[10px] font-bold text-cyber-accent font-mono block px-1">
                        {msg.sender.username}
                      </span>
                    )}

                    {/* Chat Bubble */}
                    <div
                      className={`p-3.5 rounded-2xl ${
                        isMine
                          ? 'bg-gradient-to-tr from-cyber-accent/15 to-cyber-purple/10 border border-cyber-accent/30 text-white rounded-tr-none'
                          : 'bg-cyber-card border border-cyber-border text-white rounded-tl-none'
                      }`}
                    >
                      {msg.isCodeSnippet ? (
                        <div className="font-mono text-left text-xs bg-black/60 rounded-xl p-3 border border-cyber-border overflow-x-auto space-y-2">
                          <div className="flex justify-between items-center text-[9px] text-cyber-gray border-b border-cyber-border/40 pb-1.5">
                            <span>Code Snippet: {msg.codeLanguage}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.content)}
                              className="hover:text-white transition-colors"
                            >
                              [Copy Code]
                            </button>
                          </div>
                          <pre className="text-white overflow-x-auto leading-5">{msg.content}</pre>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Timestamp & Read receipts */}
                    <div className="flex items-center justify-end gap-1.5 px-1.5">
                      <span className="text-[9px] text-cyber-gray font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && (
                        hasRead ? (
                          <CheckCheck size={11} className="text-cyber-accent" />
                        ) : (
                          <Check size={11} className="text-cyber-gray" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live Typing Status */}
            {typingChatId === activeChat._id && (
              <div className="flex justify-start">
                <div className="bg-cyber-card border border-cyber-border text-cyber-accent rounded-2xl rounded-tl-none p-3 text-[10px] font-mono flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyber-accent rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-cyber-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-cyber-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>Transmitting stream...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Control Input Footer */}
          <div className="p-4 border-t border-cyber-border glass-panel bg-opacity-40 space-y-3">
            {isCodeMode && (
              <div className="flex gap-4 items-center bg-cyber-bg/80 border border-cyber-border rounded-xl p-3">
                <Code className="text-cyber-accent" size={16} />
                <span className="text-xs font-bold text-white font-mono flex-1">CODE TRANSMISSION PANEL</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="text-xs bg-cyber-card border border-cyber-border text-white rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsCodeMode(!isCodeMode)}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  isCodeMode
                    ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-accent shadow-[0_0_10px_rgba(0,242,254,0.2)]'
                    : 'border-cyber-border text-cyber-gray hover:text-white hover:bg-cyber-hover'
                }`}
                title="Format as Code Block"
              >
                <Code size={18} />
              </button>

              <textarea
                rows={1}
                placeholder={isCodeMode ? "Enter your code snippet here..." : "Type text message..."}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 text-xs text-white placeholder-cyber-gray focus:outline-none resize-none"
              />

              <button
                onClick={handleSend}
                className="btn-primary p-3 flex items-center justify-center rounded-xl"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-12 bg-cyber-bg/10">
          <div className="w-16 h-16 rounded-3xl bg-cyber-card border border-cyber-border flex items-center justify-center text-cyber-accent shadow-[0_0_15px_rgba(0,242,254,0.1)] mb-6 animate-pulse-glow">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">Dev Chat Terminal</h3>
          <p className="text-xs text-cyber-gray max-w-sm font-mono">
            Create group collab sessions or select a peer to inspect their code channels. Secure socket channels ready.
          </p>
        </div>
      )}

      {/* Collaborative Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 border-cyber-border shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-accent font-mono">Establish Coding Group</h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="text-cyber-gray hover:text-white font-bold"
              >
                [close]
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Group Identity</label>
                <input
                  type="text"
                  placeholder="e.g. React Engineers"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-cyber-gray uppercase font-mono">Search Members</label>
                <input
                  type="text"
                  placeholder="Search user to add..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              {/* Selected Users list badges */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 py-1">
                  {selectedUsers.map(u => (
                    <span key={u._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-accent/15 border border-cyber-accent/30 text-cyber-accent font-mono text-[9px]">
                      {u.username}
                      <button onClick={() => toggleUserSelection(u)} className="hover:text-white">x</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Users search results list */}
              {searchResults.length > 0 && (
                <div className="border border-cyber-border rounded-xl divide-y divide-cyber-border/40 max-h-40 overflow-y-auto">
                  {searchResults.map((usr) => {
                    const isSelected = selectedUsers.some(u => u._id === usr._id);
                    return (
                      <button
                        key={usr._id}
                        onClick={() => toggleUserSelection(usr)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyber-hover transition-colors ${
                          isSelected ? 'bg-cyber-hover/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 text-left">
                          <img
                            src={usr.profileImage || '/uploads/default-avatar.png'}
                            alt={usr.username}
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                          <span className="text-xs font-bold text-white">{usr.username}</span>
                        </div>
                        <span className="text-[10px] text-cyber-accent font-mono">
                          {isSelected ? '[Remove]' : '[Add]'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={groupName.trim() === '' || selectedUsers.length === 0}
              className="w-full btn-primary py-2.5 text-xs uppercase"
            >
              Initialize Mainframe Thread
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
