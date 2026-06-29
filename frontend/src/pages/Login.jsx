import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, resetError } from '../store/slices/authSlice';
import { KeyRound, Mail, Terminal, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    if (!email || !password) return;
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-cyber-bg">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyber-accent opacity-5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyber-purple opacity-5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo and branding */}
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
            Where developers share educational & technical content
          </p>
        </div>

        {/* Login form card */}
        <div className="glass-card p-8 shadow-2xl relative border-cyber-border">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-accent via-cyber-purple to-cyber-pink rounded-t-2xl" />

          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-950 bg-opacity-40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-2">
                Username or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Enter email or username"
                  className="w-full pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-cyber-gray">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-cyber-accent hover:underline focus:outline-none"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="w-full pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-2 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-cyber-gray border-t border-cyber-border/40 pt-6">
            New to the tech space?{' '}
            <Link to="/register" className="text-cyber-accent font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
