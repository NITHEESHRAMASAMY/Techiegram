import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Load user from localStorage if present
const localUser = localStorage.getItem('techiegram_user');
const localToken = localStorage.getItem('techiegram_token');

const initialState = {
  user: localUser ? JSON.parse(localUser) : null,
  token: localToken || null,
  loading: false,
  error: null,
  success: false,
};

// Helper for authorized headers
const authHeader = (state) => ({
  'Authorization': `Bearer ${state.auth.token}`,
});

// Async Thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, thunkAPI) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Registration failed');
      }
      // Save details to localStorage
      localStorage.setItem('techiegram_user', JSON.stringify({
        _id: data._id,
        username: data.username,
        email: data.email,
        profileImage: data.profileImage,
        bio: data.bio,
        skills: data.skills,
        followersCount: data.followersCount,
        followingCount: data.followingCount,
      }));
      localStorage.setItem('techiegram_token', data.token);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Login failed');
      }
      localStorage.setItem('techiegram_user', JSON.stringify({
        _id: data._id,
        username: data.username,
        email: data.email,
        profileImage: data.profileImage,
        bio: data.bio,
        skills: data.skills,
        followersCount: data.followersCount,
        followingCount: data.followingCount,
      }));
      localStorage.setItem('techiegram_token', data.token);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore backend logout errors for clean client logout
  }
  localStorage.removeItem('techiegram_user');
  localStorage.removeItem('techiegram_token');
  return true;
});

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, thunkAPI) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Error requesting reset link');
      }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, thunkAPI) => {
    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Reset password failed');
      }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
      state.success = false;
    },
    updateCurrentUserProfile: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
        localStorage.setItem('techiegram_user', JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          _id: action.payload._id,
          username: action.payload.username,
          email: action.payload.email,
          profileImage: action.payload.profileImage,
          bio: action.payload.bio,
          skills: action.payload.skills,
          followersCount: action.payload.followersCount,
          followingCount: action.payload.followingCount,
        };
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          _id: action.payload._id,
          username: action.payload.username,
          email: action.payload.email,
          profileImage: action.payload.profileImage,
          bio: action.payload.bio,
          skills: action.payload.skills,
          followersCount: action.payload.followersCount,
          followingCount: action.payload.followingCount,
        };
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetError, updateCurrentUserProfile } = authSlice.actions;
export default authSlice.reducer;
