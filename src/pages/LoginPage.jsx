import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Cpu, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

export default function LoginPage({ onAuthSubmit, onBack, maintenanceMode }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error: submitError } = await onAuthSubmit(isSignUp, email, password, name);
    setIsLoading(false);
    if (submitError) setError(submitError);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent! Check your inbox.");
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err.code === 'auth/user-not-found' ? "No account found." : "Failed to send email.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-12 h-12 bg-white text-black rounded-xl mb-4 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
             <Cpu size={24} />
           </div>
           <h1 className="text-2xl font-bold tracking-tighter">
             {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome Back')}
           </h1>
           <p className="text-zinc-500 mt-2">
             {isForgotPassword ? 'Enter your email to receive a reset link' : (isSignUp ? 'Join WebFront AI today' : 'Sign in to your WebFront Dashboard')}
           </p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:border-zinc-700">
          {maintenanceMode && !isSignUp && !isForgotPassword && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> Maintenance Mode Active
            </div>
          )}
          <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20">{error}</div>}
            {successMessage && <div className="bg-green-500/10 text-green-500 text-sm p-3 rounded-lg border border-green-500/20">{successMessage}</div>}

            {isSignUp && !isForgotPassword && (
              <div className="animate-fade-in">
                <label className="block text-sm text-zinc-400 mb-2 font-medium">Full Name / Company</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Acme Corp"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="name@company.com"
                required
              />
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-zinc-400 font-medium">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1"/> Processing...
                </>
              ) : (
                isForgotPassword ? (
                  'Send Reset Link'
                ) : (
                  <>
                    <span className="mr-1">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight size={16} />
                  </>
                )
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            {isForgotPassword ? (
              <button
                onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
                className="text-blue-400 hover:text-blue-300 font-medium ml-1"
              >
                Back to Sign In
              </button>
            ) : isSignUp ? (
              <p>
                Already have an account?
                <button
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className="text-blue-400 hover:text-blue-300 font-medium ml-1"
                >
                  Log In
                </button>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p>
                  Don't have an account?
                  <button
                    onClick={() => { setIsSignUp(true); setError(''); }}
                    className="text-blue-400 hover:text-blue-300 font-medium ml-1"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-full mt-8 text-zinc-500 text-sm hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          ← Return to website
        </button>
      </div>
    </div>
  );
}
