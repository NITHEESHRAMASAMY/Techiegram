import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';

// Component layout
import Layout from './components/Layout';

// Page views
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Communities from './pages/Communities';
import Mentorship from './pages/Mentorship';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  return token ? children : <Navigate to="/login" replace />;
}

// Public Route Guard (prevents visiting login/register when already logged in)
function PublicRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  return !token ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected Mainframe Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Feed />} />
            <Route path="profile/:username" element={<Profile />} />
            <Route path="chats" element={<Chat />} />
            <Route path="communities" element={<Communities />} />
            <Route path="mentors" element={<Mentorship />} />
          </Route>

          {/* Redirect all other unmatched routes to Feed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
