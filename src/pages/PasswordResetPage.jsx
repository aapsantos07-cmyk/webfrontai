import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { secureError } from '../utils/security';
import { Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { AnimatedIcon } from '../components/icons/AnimatedIcon';

export default function PasswordResetPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = location.state || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if no user data provided
  if (!user || !userData) {
    navigate('/login');
    return null;
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      // Remove requiresPasswordReset flag from Firestore
      await updateDoc(doc(db, "clients", user.uid), {
        requiresPasswordReset: false,
        activity: arrayUnion({
          action: "Password reset completed",
          date: new Date().toLocaleDateString(),
          status: "Completed"
        })
      });

      // Navigate to appropriate dashboard
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard/overview');
      }
    } catch (err) {
      secureError("Password reset error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-600 text-black rounded-xl mb-4 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter">Reset Your Password</h1>
          <p className="text-zinc-500 mt-2">Welcome, {userData?.name}! Please set a new password for your account.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> For security, you must set a new password before accessing your dashboard.
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20">{error}</div>}

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <AnimatedIcon name="Loader2" size={16} autoplay /> Updating Password...
                </>
              ) : (
                <>
                  Reset Password <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
