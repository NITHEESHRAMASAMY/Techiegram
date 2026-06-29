import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, resetError } from '../store/slices/authSlice';
import { KeyRound, Mail, Terminal, AlertTriangle, User } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(resetError());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!username || !email || !password || !confirmPassword) {
      setValidationError('Please fill out all fields');
      return;
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    dispatch(registerUser({ username, email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-cyber-bg py-10">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyber-accent opacity-5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyber-purple opacity-5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyber-accent to-cyber-purple text-cyber-bg">
              <Terminal size={28} className="stroke-[2.5]" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
              Techie<span className="text-gradient">gram</span>
            </span>
          </div>
          <p className="text-cyber-gray font-medium text-sm mt-1">
            Build your profile and share technical knowledge
          </p>
        </div>

        {/* Register card */}
        <div className="glass-card p-8 shadow-2xl relative border-cyber-border">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-accent via-cyber-purple to-cyber-pink rounded-t-2xl" />

          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

          {(error || validationError) && (
            <div className="mb-5 p-4 rounded-xl bg-red-950 bg-opacity-40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Choose username (e.g. dev_james)"
                  className="w-full pl-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                <input
                  type="email"
                  required
                  placeholder="Enter developer email"
                  className="w-full pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                <input
                  type="password"
                  required
                  placeholder="Create strong password"
                  className="w-full pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  className="w-full pl-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-4 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                'Register & Deploy'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-cyber-gray border-t border-cyber-border/40 pt-6">
            Already registered?{' '}
            <Link to="/login" className="text-cyber-accent font-semibold hover:underline">
              Access Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
