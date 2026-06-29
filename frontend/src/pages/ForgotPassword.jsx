import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { forgotPassword, resetError } from '../store/slices/authSlice';
import { Mail, Terminal, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState('');

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(resetError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    const result = await dispatch(forgotPassword(email));
    if (forgotPassword.fulfilled.match(result)) {
      setSubmitted(true);
      // Capture development token if returned in response for easy developer usage
      if (result.payload && result.payload.resetToken) {
        setDevToken(result.payload.resetToken);
      }
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

          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-cyber-gray hover:text-cyber-accent transition-colors mb-6">
            <ArrowLeft size={14} /> Back to Login
          </Link>

          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          
          {!submitted ? (
            <>
              <p className="text-cyber-gray text-sm mb-6">
                Enter your email address and we'll log a password reset link to the system terminal.
              </p>

              {error && (
                <div className="mb-5 p-4 rounded-xl bg-red-950 bg-opacity-40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray mb-2">
                    Developer Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-cyber-gray" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="Enter your registered email"
                      className="w-full pl-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Generate Reset Token'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 mb-2">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Reset Token Generated</h3>
              <p className="text-cyber-gray text-sm">
                A password reset token has been printed to the **backend terminal console**. Check the server logs to copy your URL link.
              </p>
              {devToken && (
                <div className="p-4 bg-cyber-bg border border-cyber-border rounded-xl text-left space-y-2 mt-4">
                  <span className="block text-[10px] uppercase font-bold text-cyber-accent tracking-wider">Dev Direct Link:</span>
                  <Link
                    to={`/reset-password/${devToken}`}
                    className="text-xs font-mono break-all text-cyber-pink hover:underline"
                  >
                    http://localhost:5173/reset-password/{devToken}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
