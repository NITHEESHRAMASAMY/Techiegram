import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postReducer from './slices/postSlice';
import userReducer from './slices/userSlice';
import phaseTwoReducer from './slices/phaseTwoSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    users: userReducer,
    phaseTwo: phaseTwoReducer,
  },
});

export default store;
