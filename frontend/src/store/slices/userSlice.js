import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateCurrentUserProfile } from './authSlice';

const initialState = {
  profile: null,
  searchResults: {
    users: [],
    skills: [],
    posts: [],
  },
  loading: false,
  searchLoading: false,
  error: null,
};

// Async Thunks
export const fetchProfile = createAsyncThunk(
  'users/fetchProfile',
  async (username, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/users/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Profile fetch failed');
      }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async (formData, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Profile update failed');
      }
      // Update local storage user profile parameters
      thunkAPI.dispatch(updateCurrentUserProfile(data));
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const toggleFollowUser = createAsyncThunk(
  'users/toggleFollow',
  async (userId, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/users/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Follow toggle failed');
      }
      return { userId, data }; // returns target userId and { isFollowing }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const executeSearch = createAsyncThunk(
  'users/search',
  async (query, thunkAPI) => {
    try {
      const { auth: { token } } = thunkAPI.getState();
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Search execution failed');
      }
      return data; // returns { users, skills, posts }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserErrors: (state) => {
      state.error = null;
    },
    resetSearch: (state) => {
      state.searchResults = { users: [], skills: [], posts: [] };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.profile = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile && state.profile._id === action.payload._id) {
          state.profile = {
            ...state.profile,
            ...action.payload,
          };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Follow User
      .addCase(toggleFollowUser.fulfilled, (state, action) => {
        const { data } = action.payload;
        const currentUser = localStorage.getItem('techiegram_user') ? JSON.parse(localStorage.getItem('techiegram_user')) : null;

        // If currently viewing the user's profile, update followers array dynamically
        if (state.profile && currentUser) {
          const alreadyFollower = state.profile.followers.some(f => f._id === currentUser._id);
          if (alreadyFollower && !data.isFollowing) {
            state.profile.followers = state.profile.followers.filter(f => f._id !== currentUser._id);
            state.profile.followersCount -= 1;
          } else if (!alreadyFollower && data.isFollowing) {
            state.profile.followers.push({
              _id: currentUser._id,
              username: currentUser.username,
              profileImage: currentUser.profileImage,
            });
            state.profile.followersCount += 1;
          }
        }
      })
      // Execute Search
      .addCase(executeSearch.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(executeSearch.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(executeSearch.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserErrors, resetSearch } = userSlice.actions;
export default userSlice.reducer;
