import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  feed: [],
  userPosts: [],
  savedPosts: [],
  page: 1,
  hasMore: true,
  loading: false,
  uploading: false,
  error: null,
};

// Async Thunks
export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async (page, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/feed?page=${page}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Failed to fetch feed');
      }
      return data; // returns { posts, page, hasMore }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async (username, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/user/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Failed to fetch user posts');
      }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const fetchSavedPosts = createAsyncThunk(
  'posts/fetchSavedPosts',
  async (page, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/saved?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Failed to fetch saved posts');
      }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (formData, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: Do not set Content-Type header when sending FormData! The browser will set it automatically with boundaries.
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Post creation failed');
      }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const editPost = createAsyncThunk(
  'posts/editPost',
  async ({ id, caption }, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ caption }),
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Post edit failed');
      }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Post deletion failed');
      }
      return data; // returns { message, id }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (id, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Like action failed');
      }
      return { id, data }; // returns post ID and { likes, likesCount, isLiked }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const toggleSave = createAsyncThunk(
  'posts/toggleSave',
  async (id, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/${id}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Save action failed');
      }
      return { id, data }; // returns post ID and { saves, isSaved }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ id, text }, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Comment action failed');
      }
      return { id, data }; // returns post ID and { comment, commentsCount }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPostErrors: (state) => {
      state.error = null;
    },
    resetFeed: (state) => {
      state.feed = [];
      state.page = 1;
      state.hasMore = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Feed
      .addCase(fetchFeed.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.feed = action.payload.posts;
        } else {
          // Prevent duplicates
          const existingIds = new Set(state.feed.map(p => p._id));
          const uniqueNewPosts = action.payload.posts.filter(p => !existingIds.has(p._id));
          state.feed = [...state.feed, ...uniqueNewPosts];
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Posts
      .addCase(fetchUserPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.userPosts = action.payload;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Saved Posts
      .addCase(fetchSavedPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.savedPosts = action.payload.posts;
      })
      .addCase(fetchSavedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.uploading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.uploading = false;
        state.feed = [action.payload, ...state.feed];
      })
      .addCase(createPost.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // Edit Post
      .addCase(editPost.fulfilled, (state, action) => {
        // Update in feed
        state.feed = state.feed.map((post) =>
          post._id === action.payload._id ? action.payload : post
        );
        // Update in user posts
        state.userPosts = state.userPosts.map((post) =>
          post._id === action.payload._id ? action.payload : post
        );
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.feed = state.feed.filter((post) => post._id !== action.payload.id);
        state.userPosts = state.userPosts.filter((post) => post._id !== action.payload.id);
        state.savedPosts = state.savedPosts.filter((post) => post._id !== action.payload.id);
      })
      // Toggle Like
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        // Update feed post likes
        state.feed = state.feed.map((post) => {
          if (post._id === id) {
            return { ...post, likes: data.likes };
          }
          return post;
        });
        // Update user posts likes
        state.userPosts = state.userPosts.map((post) => {
          if (post._id === id) {
            return { ...post, likes: data.likes };
          }
          return post;
        });
        // Update saved posts likes
        state.savedPosts = state.savedPosts.map((post) => {
          if (post._id === id) {
            return { ...post, likes: data.likes };
          }
          return post;
        });
      })
      // Toggle Save
      .addCase(toggleSave.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        // Update feed post saves
        state.feed = state.feed.map((post) => {
          if (post._id === id) {
            return { ...post, saves: data.saves };
          }
          return post;
        });
        // Update user posts saves
        state.userPosts = state.userPosts.map((post) => {
          if (post._id === id) {
            return { ...post, saves: data.saves };
          }
          return post;
        });
        // Remove or add to savedPosts array
        const currentUser = localStorage.getItem('techiegram_user') ? JSON.parse(localStorage.getItem('techiegram_user')) : null;
        if (currentUser) {
          const isSavedNow = data.saves.includes(currentUser._id);
          if (!isSavedNow) {
            state.savedPosts = state.savedPosts.filter((p) => p._id !== id);
          } else {
            // Find post in feed or userPosts to append
            const sourcePost = state.feed.find(p => p._id === id) || state.userPosts.find(p => p._id === id);
            if (sourcePost && !state.savedPosts.find(p => p._id === id)) {
              state.savedPosts = [sourcePost, ...state.savedPosts];
            }
          }
        }
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        // Update in feed
        state.feed = state.feed.map((post) => {
          if (post._id === id) {
            return { ...post, comments: [...post.comments, data.comment] };
          }
          return post;
        });
        // Update in userPosts
        state.userPosts = state.userPosts.map((post) => {
          if (post._id === id) {
            return { ...post, comments: [...post.comments, data.comment] };
          }
          return post;
        });
        // Update in savedPosts
        state.savedPosts = state.savedPosts.map((post) => {
          if (post._id === id) {
            return { ...post, comments: [...post.comments, data.comment] };
          }
          return post;
        });
      });
  },
});

export const { clearPostErrors, resetFeed } = postSlice.actions;
export default postSlice.reducer;
