import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword, resetError } from '../store/slices/authSlice';
import { KeyRound, Terminal, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(resetError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!password || !confirmPassword) {
      setValidationError('Please enter all fields');
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

    const result = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(result)) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-cyber-bg">
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
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl relative border-cyber-border">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-accent via-cyber-purple to-cyber-pink rounded-t-2xl" />

          <h2 className="text-2xl font-bold text-white mb-6">Choose New Password</h2>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || validationError) && (
                <div className="p-4 rounded-xl bg-red-950 bg-opacity-40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <span>{validationError || error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-2">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    className="w-full pl-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    className="w-full pl-11"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 mb-2">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Password Updated</h3>
              <p className="text-cyber-gray text-sm">
                Your password has been changed successfully. You can now login using your new credentials.
              </p>
              <Link to="/login" className="block w-full btn-primary mt-6">
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
