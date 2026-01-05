import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import CountdownTimer from '../components/common/CountdownTimer';
import { Lock, ArrowRight, Shield, CalendarDays, Phone, Mail, X } from 'lucide-react';
import { AnimatedIcon } from '../components/icons/AnimatedIcon';

export default function EarlyAccessPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const LAUNCH_DATE = new Date('2026-01-02T00:00:00');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const docSnap = await getDoc(doc(db, "clients", user.uid));

      if (docSnap.exists() && docSnap.data().role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Admin access only during early access period.');
        await signOut(auth);
      }
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>

      <div className="w-full max-w-lg z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl mb-6 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
            <Lock size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Early Access
          </h1>
          <p className="text-zinc-400 text-lg mb-2">WebFront AI is launching soon</p>
          <div className="inline-block px-4 py-2 bg-blue-900/30 text-blue-400 rounded-full text-sm font-bold border border-blue-500/30 mb-6">
            <CalendarDays size={14} className="inline mr-2" />
            Public Launch: January 2, 2026
          </div>
        </div>

        <CountdownTimer targetDate={LAUNCH_DATE} />

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <Shield size={16} /> Admin Access Only
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="admin@webfrontai.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
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
                  <AnimatedIcon name="Loader2" size={16} autoplay /> Verifying...
                </>
              ) : (
                <>
                  Access Dashboard <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            <p>Interested in early access?</p>
            <button
              onClick={() => setShowContactModal(true)}
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Contact us
            </button>
          </div>
        </div>

        {showContactModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowContactModal(false)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Get in Touch</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-zinc-400 mb-6">Choose how you'd like to reach us</p>

              <div className="space-y-3">
                <a
                  href="tel:+18627540435"
                  className="flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all group"
                >
                  <div className="bg-blue-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">Call Us</div>
                    <div className="text-zinc-400 text-sm">+1 (862) 754-0435</div>
                  </div>
                </a>

                <a
                  href="mailto:andre@webfrontai.com"
                  className="flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all group"
                >
                  <div className="bg-purple-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">Email Us</div>
                    <div className="text-zinc-400 text-sm">andre@webfrontai.com</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-zinc-600">
          <p>© 2025 WebFront AI. Launching January 2026.</p>
        </div>
      </div>
    </div>
  );
}
