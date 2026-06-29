import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// helper headers generator
const getAuthHeaders = (thunkAPI, customHeaders = {}) => {
  const { auth: { token } } = thunkAPI.getState();
  return {
    'Authorization': `Bearer ${token}`,
    ...customHeaders,
  };
};

// --- CHAT THUNKS ---
export const fetchChats = createAsyncThunk('phaseTwo/fetchChats', async (_, thunkAPI) => {
  try {
    const res = await fetch('/api/chats', { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch chats failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const accessChat = createAsyncThunk('phaseTwo/accessChat', async (userId, thunkAPI) => {
  try {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Access chat failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const createGroupChat = createAsyncThunk('phaseTwo/createGroupChat', async ({ users, name }, thunkAPI) => {
  try {
    const res = await fetch('/api/chats/group', {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, users: JSON.stringify(users) }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Create group failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

// --- MESSAGES THUNKS ---
export const fetchMessages = createAsyncThunk('phaseTwo/fetchMessages', async (chatId, thunkAPI) => {
  try {
    const res = await fetch(`/api/messages/${chatId}`, { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch messages failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const sendMessage = createAsyncThunk('phaseTwo/sendMessage', async ({ content, chatId, isCodeSnippet, codeLanguage }, thunkAPI) => {
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content, chatId, isCodeSnippet, codeLanguage }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Send message failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const markMessagesAsRead = createAsyncThunk('phaseTwo/markRead', async (chatId, thunkAPI) => {
  try {
    const res = await fetch(`/api/messages/${chatId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    return { chatId, data };
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

// --- NOTIFICATION THUNKS ---
export const fetchNotifications = createAsyncThunk('phaseTwo/fetchNotifications', async (_, thunkAPI) => {
  try {
    const res = await fetch('/api/notifications', { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch notifications failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const markNotificationAsRead = createAsyncThunk('phaseTwo/markNotifRead', async (notifId, thunkAPI) => {
  try {
    const res = await fetch(`/api/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Update notification failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const markAllNotificationsAsRead = createAsyncThunk('phaseTwo/markAllNotifRead', async (_, thunkAPI) => {
  try {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const clearAllNotifications = createAsyncThunk('phaseTwo/clearAllNotif', async (_, thunkAPI) => {
  try {
    const res = await fetch('/api/notifications', {
      method: 'DELETE',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

// --- COMMUNITIES THUNKS ---
export const fetchCommunities = createAsyncThunk('phaseTwo/fetchCommunities', async (_, thunkAPI) => {
  try {
    const res = await fetch('/api/communities', { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch communities failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const createCommunity = createAsyncThunk('phaseTwo/createCommunity', async ({ name, description, topic }, thunkAPI) => {
  try {
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, description, topic }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Create community failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const joinCommunity = createAsyncThunk('phaseTwo/joinCommunity', async (commId, thunkAPI) => {
  try {
    const res = await fetch(`/api/communities/${commId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Join community failed');
    return { commId, members: data.members };
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const leaveCommunity = createAsyncThunk('phaseTwo/leaveCommunity', async (commId, thunkAPI) => {
  try {
    const res = await fetch(`/api/communities/${commId}/leave`, {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Leave community failed');
    return { commId, members: data.members };
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const fetchCommunityPosts = createAsyncThunk('phaseTwo/fetchCommunityPosts', async (commId, thunkAPI) => {
  try {
    const res = await fetch(`/api/communities/${commId}/posts`, { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch community posts failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const createCommunityPost = createAsyncThunk('phaseTwo/createCommunityPost', async ({ commId, title, content, codeSnippet, codeLanguage, difficulty }, thunkAPI) => {
  try {
    const res = await fetch(`/api/communities/${commId}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title, content, codeSnippet, codeLanguage, difficulty }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Create community post failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const addCommunityComment = createAsyncThunk('phaseTwo/addCommunityComment', async ({ postId, text, codeSnippet, codeLanguage }, thunkAPI) => {
  try {
    const res = await fetch(`/api/communities/posts/${postId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text, codeSnippet, codeLanguage }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Add reply failed');
    return { postId, comment: data.comment };
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const toggleLikeCommunityPost = createAsyncThunk('phaseTwo/toggleLikeCommunityPost', async (postId, thunkAPI) => {
  try {
    const res = await fetch(`/api/communities/posts/${postId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Like post failed');
    return { postId, likes: data.likes };
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

// --- MENTOR THUNKS ---
export const fetchMentors = createAsyncThunk('phaseTwo/fetchMentors', async (_, thunkAPI) => {
  try {
    const res = await fetch('/api/mentors', { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch mentors failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const toggleMentorMode = createAsyncThunk('phaseTwo/toggleMentor', async (mentorSettings, thunkAPI) => {
  try {
    const res = await fetch('/api/mentors/toggle', {
      method: 'PUT',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(mentorSettings),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Toggle mentor failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const fetchQuestions = createAsyncThunk('phaseTwo/fetchQuestions', async (role, thunkAPI) => {
  try {
    const res = await fetch(`/api/mentors/questions?role=${role || ''}`, { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch questions failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const askMentorQuestion = createAsyncThunk('phaseTwo/askQuestion', async (qBody, thunkAPI) => {
  try {
    const res = await fetch('/api/mentors/questions', {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(qBody),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Ask question failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const fetchQuestionDetail = createAsyncThunk('phaseTwo/fetchQuestionDetail', async (qId, thunkAPI) => {
  try {
    const res = await fetch(`/api/mentors/questions/${qId}`, { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch question details failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const answerQuestion = createAsyncThunk('phaseTwo/answerQuestion', async ({ qId, text, codeSnippet, codeLanguage }, thunkAPI) => {
  try {
    const res = await fetch(`/api/mentors/questions/${qId}/answers`, {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text, codeSnippet, codeLanguage }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Answer question failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

// --- BOOKMARKS THUNKS ---
export const fetchCollections = createAsyncThunk('phaseTwo/fetchCollections', async (_, thunkAPI) => {
  try {
    const res = await fetch('/api/bookmarks/collections', { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Fetch collections failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const createCollection = createAsyncThunk('phaseTwo/createCollection', async (name, thunkAPI) => {
  try {
    const res = await fetch('/api/bookmarks/collections', {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Create collection failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const deleteCollection = createAsyncThunk('phaseTwo/deleteCollection', async (collId, thunkAPI) => {
  try {
    const res = await fetch(`/api/bookmarks/collections/${collId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(thunkAPI),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Delete collection failed');
    return collId;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

export const togglePostInCollection = createAsyncThunk('phaseTwo/togglePostInCollection', async ({ collId, postId }, thunkAPI) => {
  try {
    const res = await fetch(`/api/bookmarks/collections/${collId}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(thunkAPI, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Toggle post in collection failed');
    return data.collection; // returns updated collection
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});

// --- ADVANCED SEARCH THUNK ---
export const executeAdvancedSearch = createAsyncThunk('phaseTwo/advancedSearch', async ({ tech, difficulty, creator, type }, thunkAPI) => {
  try {
    let query = `/api/search/advanced?type=${type || 'all'}`;
    if (tech) query += `&tech=${encodeURIComponent(tech)}`;
    if (difficulty) query += `&difficulty=${encodeURIComponent(difficulty)}`;
    if (creator) query += `&creator=${encodeURIComponent(creator)}`;
    
    const res = await fetch(query, { headers: getAuthHeaders(thunkAPI) });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || 'Advanced search failed');
    return data;
  } catch (err) { return thunkAPI.rejectWithValue(err.message); }
});


// Slice config
const phaseTwoSlice = createSlice({
  name: 'phaseTwo',
  initialState: {
    chats: [],
    activeChat: null,
    messages: [],
    typingChatId: null,
    typingUser: null,
    
    notifications: [],
    notificationCount: 0,
    
    communities: [],
    activeCommunity: null,
    communityPosts: [],
    
    mentors: [],
    questions: [],
    activeQuestion: null,
    
    collections: [],
    activeCollection: null,
    
    advancedSearchResults: { posts: [], questions: [], communities: [], users: [] },
    
    loading: false,
    error: null,
  },
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    addReceivedMessage: (state, action) => {
      const msg = action.payload;
      // If message belongs to active chat, add it to chat workspace
      if (state.activeChat && state.activeChat._id === msg.chat._id) {
        state.messages.push(msg);
      }
      
      // Update chats list latestMessage
      const chatIndex = state.chats.findIndex(c => c._id === msg.chat._id);
      if (chatIndex !== -1) {
        const updatedChat = { ...state.chats[chatIndex], latestMessage: msg };
        // move to top
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
      } else {
        // refetch chats
      }
    },
    setTypingStatus: (state, action) => {
      const { chatId, username } = action.payload;
      if (state.activeChat && state.activeChat._id === chatId) {
        state.typingChatId = chatId;
        state.typingUser = username;
      }
    },
    clearTypingStatus: (state, action) => {
      const { chatId } = action.payload;
      if (state.typingChatId === chatId) {
        state.typingChatId = null;
        state.typingUser = null;
      }
    },
    addNewNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.notificationCount += 1;
    },
    resetNotificationCount: (state) => {
      state.notificationCount = 0;
    },
    updateUserPresence: (state, action) => {
      const { userId, status } = action.payload;
      state.chats = state.chats.map(chat => {
        const users = chat.users.map(u => {
          if (u._id === userId) {
            return { ...u, onlineStatus: status };
          }
          return u;
        });
        return { ...chat, users };
      });
      if (state.activeChat) {
        const users = state.activeChat.users.map(u => {
          if (u._id === userId) {
            return { ...u, onlineStatus: status };
          }
          return u;
        });
        state.activeChat = { ...state.activeChat, users };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // chats
      .addCase(fetchChats.pending, (state) => { state.loading = true; })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(accessChat.fulfilled, (state, action) => {
        const chat = action.payload;
        const exists = state.chats.find(c => c._id === chat._id);
        if (!exists) {
          state.chats.unshift(chat);
        }
        state.activeChat = chat;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      
      // messages
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        state.messages.push(msg);
        
        // update latestMessage in chats list
        const chatIndex = state.chats.findIndex(c => c._id === msg.chat._id);
        if (chatIndex !== -1) {
          const updatedChat = { ...state.chats[chatIndex], latestMessage: msg };
          state.chats.splice(chatIndex, 1);
          state.chats.unshift(updatedChat);
        }
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        state.messages = state.messages.map(msg => {
          // add current user (which is reader) to readBy list
          return msg; 
        });
      })
      
      // notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.notificationCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.notifications = state.notifications.map(n => 
          n._id === action.payload._id ? action.payload : n
        );
        state.notificationCount = state.notifications.filter(n => !n.isRead).length;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
        state.notificationCount = 0;
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.notificationCount = 0;
      })
      
      // communities
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.communities = action.payload;
      })
      .addCase(createCommunity.fulfilled, (state, action) => {
        state.communities.unshift(action.payload);
      })
      .addCase(joinCommunity.fulfilled, (state, action) => {
        const { commId, members } = action.payload;
        state.communities = state.communities.map(c => 
          c._id === commId ? { ...c, members } : c
        );
      })
      .addCase(leaveCommunity.fulfilled, (state, action) => {
        const { commId, members } = action.payload;
        state.communities = state.communities.map(c => 
          c._id === commId ? { ...c, members } : c
        );
      })
      .addCase(fetchCommunityPosts.fulfilled, (state, action) => {
        state.communityPosts = action.payload;
      })
      .addCase(createCommunityPost.fulfilled, (state, action) => {
        state.communityPosts.unshift(action.payload);
      })
      .addCase(addCommunityComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        state.communityPosts = state.communityPosts.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              comments: [...p.comments, comment],
            };
          }
          return p;
        });
      })
      .addCase(toggleLikeCommunityPost.fulfilled, (state, action) => {
        const { postId, likes } = action.payload;
        state.communityPosts = state.communityPosts.map(p => 
          p._id === postId ? { ...p, likes } : p
        );
      })
      
      // mentors
      .addCase(fetchMentors.fulfilled, (state, action) => {
        state.mentors = action.payload;
      })
      .addCase(toggleMentorMode.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        // update profile list
        state.mentors = state.mentors.map(m => 
          m._id === updatedUser._id ? { ...m, ...updatedUser } : m
        );
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.questions = action.payload;
      })
      .addCase(askMentorQuestion.fulfilled, (state, action) => {
        state.questions.unshift(action.payload);
      })
      .addCase(fetchQuestionDetail.fulfilled, (state, action) => {
        state.activeQuestion = action.payload;
      })
      .addCase(answerQuestion.fulfilled, (state, action) => {
        state.activeQuestion = action.payload;
      })
      
      // bookmarks
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.collections = action.payload;
      })
      .addCase(createCollection.fulfilled, (state, action) => {
        state.collections.unshift(action.payload);
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.collections = state.collections.filter(c => c._id !== action.payload);
      })
      .addCase(togglePostInCollection.fulfilled, (state, action) => {
        const updatedColl = action.payload;
        state.collections = state.collections.map(c => 
          c._id === updatedColl._id ? updatedColl : c
        );
      })
      
      // advanced search
      .addCase(executeAdvancedSearch.fulfilled, (state, action) => {
        state.advancedSearchResults = action.payload;
      });
  }
});

export const {
  clearErrors,
  setActiveChat,
  addReceivedMessage,
  setTypingStatus,
  clearTypingStatus,
  addNewNotification,
  resetNotificationCount,
  updateUserPresence
} = phaseTwoSlice.actions;

export default phaseTwoSlice.reducer;
