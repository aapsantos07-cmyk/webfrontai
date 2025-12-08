import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Code, Cpu, ArrowRight, Check, Menu, X, ChevronDown, Lock,
  LayoutDashboard, FileText, CreditCard, Settings, Send, User, Bot, Palette,
  Brain, Headphones, TrendingUp, LogIn, Download, Bell, Shield, Mail, Sparkles,
  Loader2, Users, BarChart3, Briefcase, Edit3, Plus, Save, Trash2, Search,
  DollarSign, Activity, UploadCloud, XCircle, CheckCircle2, LogOut, AlertTriangle,
  Power, ListTodo, FolderOpen, HelpCircle, BookOpen, Clock, CalendarDays, UserCheck,
  // Added Icons for Admin Panel
  Database, FileJson, FileSpreadsheet, History, Sliders, ClipboardList, Phone
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';

import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs, deleteDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions'; // ADDED

// --- LOCAL FIREBASE CONFIG ---
import { auth, db, storage, functions } from './firebase'; 
// --------------------------------

// SECURITY: Removed API keys from frontend. They are no longer safe here.

// --- HELPER FUNCTIONS ---
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const safeParseAmount = (amount) => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') return parseFloat(amount.replace(/[^0-9.-]+/g, "")) || 0;
  return 0;
};

// --- UPDATED AI CHAT COMPONENT (SECURE) ---

function AIChatDemo() {
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hello. I am WEBFRONT_AI. How can I assist your agency today?" }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  // SECURITY FIX: Removed useEffect that fetched admin/ai_settings. 
  // Client should NEVER know the system prompt or API keys.

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  };
  useEffect(scrollToBottom, [messages]);

  const formatMessage = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      // SECURITY FIX: Call Cloud Function instead of calling OpenAI/Gemini directly
      const chatFunction = httpsCallable(functions, 'chatWithAI');
      
      const result = await chatFunction({ 
        message: userMsg,
        history: messages // Optional: Send history if your backend supports it
      });

      // The backend should return { text: "response" }
      const responseText = result.data.text;

      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (error) {
      console.error("AI Error:", error);

      // Provide a more helpful error message based on the error type
      let errorMessage = "I'm having trouble responding right now. Please try again in a moment.";

      // Check for specific Firebase function errors
      if (error?.code === 'functions/failed-precondition' || error?.code === 'functions/not-found') {
        errorMessage = "I'm not fully configured yet. Please contact the administrator.";
      } else if (error?.code === 'functions/unavailable' || error?.message?.includes('network')) {
        errorMessage = "I'm having connection issues. Please check your internet and try again.";
      }

      setMessages(prev => [...prev, { role: 'ai', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[400px] md:h-[500px] transition-all duration-500 hover:shadow-blue-900/20 hover:border-zinc-700">
      <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-[pulse_2s_infinite]"></div>
           <span className="font-mono text-sm text-zinc-400">
             WEBFRONT_AI
           </span>
        </div>
        <Sparkles size={18} className="text-blue-400 animate-pulse" />
      </div>
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[85%] p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/20' : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'}`}>
              {formatMessage(m.text)}
            </div>
          </div>
        ))}
        {isTyping && <div className="flex justify-start animate-pulse"><div className="bg-zinc-800 p-3 rounded-lg rounded-bl-none flex gap-1 items-center border border-zinc-700"><Loader2 size={14} className="animate-spin text-zinc-500" /><span className="text-xs text-zinc-500 ml-2">Thinking...</span></div></div>}
      </div>
      <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }} placeholder="Ask about pricing, services..." className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-base md:text-sm text-white focus:outline-none focus:border-white transition-colors"/>
        <button onClick={handleSend} className="bg-white text-black p-2 rounded-lg hover:bg-gray-200 transition-colors transform active:scale-95"><Send size={18} /></button>
      </div>
    </div>
  );
}

// ... Rest of your UI Helper Components (FadeIn, Button, Card, etc.) remain exactly the same ...

function useOnScreen(ref, rootMargin = "0px") {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIntersecting(true); },
      { rootMargin }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [ref, rootMargin]);
  return isIntersecting;
}

const FadeIn = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isVisible = useOnScreen(ref, "-50px");
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};

function Button({ children, variant = 'primary', className = '', onClick, type="button", title="", disabled=false }) {
  const baseStyle = "px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]",
    secondary: "bg-transparent border border-zinc-700 text-white hover:border-white hover:bg-zinc-900",
    accent: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20",
    success: "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>{children}</button>;
}

function Card({ children, className = '' }) {
  return <div className={`bg-zinc-900/40 backdrop-blur-md border border-zinc-800 p-6 md:p-8 rounded-2xl hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900/60 ${className}`}>{children}</div>;
}

function ProjectOnboardingModal({ isOpen, onSubmit }) {
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!projectName.trim()) return;
    setLoading(true);
    await onSubmit(projectName);
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
        <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Briefcase size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-white tracking-tight">Let's get started.</h2>
            <p className="text-zinc-500">Name your new project to begin.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Project Name</label>
            <input autoFocus type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Acme Corp Redesign" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-blue-500 focus:bg-zinc-900 transition-all"/>
          </div>
          <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={!projectName.trim() || loading}>
            {loading ? <><Loader2 className="animate-spin mr-2"/> Setting up...</> : <>Launch Project <ArrowRight size={20}/></>}
          </Button>
        </form>
      </div>
    </div>
  );
}

function PasswordResetScreen({ user, userData, onResetComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      onResetComplete();
    } catch (err) {
      console.error("Password reset error:", err);
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
                  <Loader2 size={16} className="animate-spin mr-1"/> Updating Password...
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

function AuthScreen({ onAuthSubmit, onBack, maintenanceMode }) {
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
    setIsLoading(true); setError('');
    const { error: submitError } = await onAuthSubmit(isSignUp, email, password, name);
    setIsLoading(false);
    if (submitError) setError(submitError);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address first."); return; }
    setIsLoading(true); setError(''); setSuccessMessage('');
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
           <div className="inline-flex items-center justify-center w-12 h-12 bg-white text-black rounded-xl mb-4 shadow-[0_0_20px_rgba(255,255,255,0.3)]"><Cpu size={24} /></div>
           <h1 className="text-2xl font-bold tracking-tighter">{isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome Back')}</h1>
           <p className="text-zinc-500 mt-2">{isForgotPassword ? 'Enter your email to receive a reset link' : (isSignUp ? 'Join WebFront AI today' : 'Sign in to your WebFront Dashboard')}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:border-zinc-700">
          {maintenanceMode && !isSignUp && !isForgotPassword && (<div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertTriangle size={16} /> Maintenance Mode Active</div>)}
          <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20">{error}</div>}
            {successMessage && <div className="bg-green-500/10 text-green-500 text-sm p-3 rounded-lg border border-green-500/20">{successMessage}</div>}
            {isSignUp && !isForgotPassword && (
              <div className="animate-fade-in">
                <label className="block text-sm text-zinc-400 mb-2 font-medium">Full Name / Company</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Acme Corp" required={isSignUp} />
              </div>
            )}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="name@company.com" required />
            </div>
            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-zinc-400 font-medium">Password</label>
                  {!isSignUp && (<button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }} className="text-xs text-blue-400 hover:text-blue-300">Forgot Password?</button>)}
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" required />
              </div>
            )}
            <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <><Loader2 size={16} className="animate-spin mr-1"/> Processing...</> : (isForgotPassword ? 'Send Reset Link' : <><span className="mr-1">{isSignUp ? 'Create Account' : 'Sign In'}</span> <ArrowRight size={16} /></>)}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-zinc-500">
            {isForgotPassword ? (<button onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }} className="text-blue-400 hover:text-blue-300 font-medium ml-1">Back to Sign In</button>) : isSignUp ? (<p>Already have an account? <button onClick={() => { setIsSignUp(false); setError(''); }} className="text-blue-400 hover:text-blue-300 font-medium ml-1">Log In</button></p>) : (<div className="flex flex-col gap-2"><p>Don't have an account? <button onClick={() => { setIsSignUp(true); setError(''); }} className="text-blue-400 hover:text-blue-300 font-medium ml-1">Sign Up</button></p></div>)}
          </div>
        </div>
        <button onClick={onBack} className="w-full mt-8 text-zinc-500 text-sm hover:text-white transition-colors flex items-center justify-center gap-2">← Return to website</button>
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate - new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
        <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-4 sm:p-6 min-w-[70px] sm:min-w-[90px] shadow-2xl group-hover:scale-105 transition-transform duration-300">
          <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-b from-white via-blue-100 to-blue-300 bg-clip-text text-transparent tabular-nums animate-pulse">
            {String(value).padStart(2, '0')}
          </div>
        </div>
      </div>
      <div className="text-xs sm:text-sm text-zinc-500 font-medium uppercase tracking-wider mt-3">
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex justify-center gap-3 sm:gap-6 mb-10">
      <TimeUnit value={timeLeft.days} label="Days" />
      <div className="flex items-center text-3xl sm:text-5xl font-bold text-blue-500 animate-pulse -mt-4">:</div>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <div className="flex items-center text-3xl sm:text-5xl font-bold text-blue-500 animate-pulse -mt-4">:</div>
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <div className="flex items-center text-3xl sm:text-5xl font-bold text-blue-500 animate-pulse -mt-4">:</div>
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}

function EarlyAccessGate({ onAdminLogin }) {
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
        onAdminLogin();
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
                  <Loader2 size={16} className="animate-spin" /> Verifying...
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
                  href="tel:+19295157457"
                  className="flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all group"
                >
                  <div className="bg-blue-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">Call Us</div>
                    <div className="text-zinc-400 text-sm">+1 (929) 515-7457</div>
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

function PhoneCallDemo({ isOpen, onClose }) {
  const [callState, setCallState] = useState('dialing'); // dialing, connected, ended
  const [messages, setMessages] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);

  useEffect(() => {
    console.log("PhoneCallDemo isOpen:", isOpen);
    if (!isOpen) return;

    // Play ring tone and simulate dialing
    setCallState('dialing');
    const dialTimeout = setTimeout(async () => {
      setCallState('connected');
      setCallDuration(0);

      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // AI greeting
      const greeting = "Hello! Thank you for calling Valley Medical Center. This is a demo of our AI receptionist. How may I help you today?";
      setMessages([{ role: 'ai', text: greeting }]);
      speak(greeting);

      // Start listening
      startListening();
    }, 3000);

    return () => {
      clearTimeout(dialTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      stopListening();
      synthRef.current.cancel();
    };
  }, [isOpen]);

  const speak = (text) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callState === 'connected') startListening();
    };
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setMessages(prev => [...prev, { role: 'user', text: transcript }]);

      // Call AI with medical receptionist prompt
      try {
        const chatFunction = httpsCallable(functions, 'chatWithAI');
        const medicalPrompt = "You are an AI medical office receptionist for Valley Medical Center (a demo). You do NOT give medical advice or diagnoses. You only help with logistics: booking and confirming appointments, answering questions about office hours (Mon-Fri 8AM-6PM, Sat 9AM-2PM), services (general practice, pediatrics, dermatology), providers (Dr. Smith, Dr. Johnson, Dr. Lee), and accepted insurance (Blue Cross, Aetna, United Healthcare, Medicare). Always remind users this is a demo and no real appointments are being scheduled. Keep responses conversational and brief (2-3 sentences max).";

        const result = await chatFunction({
          message: transcript,
          history: messages,
          customSystemPrompt: medicalPrompt
        });

        const responseText = result.data.text;
        setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
        speak(responseText);
      } catch (error) {
        console.error("AI Error:", error);
        const errorMsg = "I'm sorry, I'm having trouble connecting right now. Please try again.";
        setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
        speak(errorMsg);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const hangUp = () => {
    setCallState('ended');
    stopListening();
    synthRef.current.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => onClose(), 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={hangUp}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Medical Office AI – Live Demo</h2>
          <p className="text-zinc-400 text-sm">Simulated phone-style conversation, no real call placed.</p>
        </div>

        {/* Call Status */}
        {callState === 'dialing' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
              <Phone size={40} className="text-white" />
            </div>
            <p className="text-xl font-bold mb-2">Calling...</p>
            <p className="text-zinc-400 text-sm">Valley Medical Center</p>
          </div>
        )}

        {callState === 'connected' && (
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold">Connected</span>
              </div>
              <div className="text-zinc-400 text-sm font-mono">{formatTime(callDuration)}</div>
            </div>

            {/* Transcript */}
            <div className="h-[300px] overflow-y-auto mb-6 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isListening && (
                <div className="flex justify-end">
                  <div className="bg-blue-600/20 border border-blue-500 text-blue-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    Listening...
                  </div>
                </div>
              )}
              {isSpeaking && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800/50 border border-zinc-700 text-zinc-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Speaking...
                  </div>
                </div>
              )}
            </div>

            {/* Hang Up Button */}
            <button
              onClick={hangUp}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={20} className="rotate-135" />
              Hang Up
            </button>
          </div>
        )}

        {callState === 'ended' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Phone size={40} className="text-zinc-500" />
            </div>
            <p className="text-xl font-bold mb-2">Call Ended</p>
            <p className="text-zinc-400 text-sm">Duration: {formatTime(callDuration)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingPage({ onLogin }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPhoneDemo, setShowPhoneDemo] = useState(false);
  
  useEffect(() => { 
    const handleScroll = () => setScrolled(window.scrollY > 50); 
    window.addEventListener('scroll', handleScroll); 
    return () => window.removeEventListener('scroll', handleScroll); 
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-zinc-800 py-3 md:py-4' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center"><div className="text-xl md:text-2xl font-bold tracking-tighter flex items-center gap-2"><div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg"><Cpu size={20} /></div>WEBFRONT AI</div><div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400"><a href="#services" className="hover:text-white transition-colors">Services</a><a href="#demo" className="hover:text-white transition-colors">AI Demo</a><a href="#pricing" className="hover:text-white transition-colors">Pricing</a><button onClick={() => onLogin()} className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"><LogIn size={14} /> Login</button><Button variant="primary" onClick={() => window.location.href = 'tel:9295157457'}>Book Strategy Call</Button></div><button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={28}/> : <Menu size={28}/>}</button></div>
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[70px] bg-black/95 backdrop-blur-lg z-40 p-8 flex flex-col gap-6 animate-fade-in border-t border-zinc-800">
            <a href="#services" onClick={() => { setIsMenuOpen(false); scrollTo('services'); }} className="text-2xl font-bold text-zinc-400 hover:text-white">Services</a>
            <a href="#demo" onClick={() => { setIsMenuOpen(false); scrollTo('demo'); }} className="text-2xl font-bold text-zinc-400 hover:text-white">AI Demo</a>
            <a href="#pricing" onClick={() => { setIsMenuOpen(false); scrollTo('pricing'); }} className="text-2xl font-bold text-zinc-400 hover:text-white">Pricing</a>
            <hr className="border-zinc-800"/>
            <button onClick={() => onLogin()} className="text-left text-2xl font-bold text-blue-400 hover:text-blue-300">Login to Portal</button>
            <Button variant="primary" className="mt-4 py-4 w-full" onClick={() => { setIsMenuOpen(false); window.location.href = 'tel:9295157457'; }}>Book Strategy Call</Button>
          </div>
        )}
      </nav>
      <section className="pt-32 pb-16 md:pt-48 md:pb-32 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] md:w-[1000px] md:h-[500px] bg-blue-900/20 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none animate-[pulse_5s_infinite]"></div>
        <div className="container mx-auto px-4 md:px-6 text-center">
          <FadeIn delay={100}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] md:text-xs font-mono mb-6 md:mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-[pulse_2s_infinite]"></span>ACCEPTING NEW CLIENTS FOR Q4
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 md:mb-8 bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-tight md:leading-[1.1]">ELEVATE YOUR <br className="hidden md:block"/> DIGITAL REALITY.</h1>
          </FadeIn>
          <FadeIn delay={300}>
            <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed px-4">WebFront AI builds high-performance websites and autonomous AI receptionists that work while you sleep. The future isn't coming—it's hired.</p>
          </FadeIn>
          <FadeIn delay={400} className="flex flex-col sm:flex-row justify-center gap-4 items-center px-4">
            <Button variant="primary" onClick={() => onLogin()} className="w-full sm:w-auto py-4">Start Project</Button>
            <Button variant="secondary" onClick={() => scrollTo('portfolio')} className="w-full sm:w-auto py-4">View Portfolio</Button>
          </FadeIn>
        </div>
      </section>
      <section className="py-8 md:py-12 border-y border-zinc-900 bg-zinc-950/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
             {[{ icon: Palette, label: "Design", desc: "Minimalist aesthetics" }, { icon: Brain, label: "Intelligence", desc: "Autonomous agents" }, { icon: Headphones, label: "Support", desc: "24/7 Reliability" }, { icon: TrendingUp, label: "Growth", desc: "Scalable architecture" }].map((item, i) => (
               <FadeIn key={i} delay={i * 100} className="flex flex-col items-center text-center gap-3 group"><div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-blue-500 group-hover:bg-zinc-800 transition-all duration-300"><item.icon size={24} /></div><h3 className="font-bold text-lg">{item.label}</h3><p className="text-sm text-zinc-500 hidden sm:block">{item.desc}</p></FadeIn>
             ))}
          </div>
        </div>
      </section>
      <section id="services" className="py-16 md:py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <FadeIn className="mb-12 md:mb-16"><h2 className="text-3xl md:text-5xl font-bold mb-6">OUR SERVICES</h2><div className="w-20 h-1 bg-blue-600"></div></FadeIn>
          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn delay={100}>
              <Card className="group cursor-pointer h-full"><div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors duration-300 shadow-lg"><Code size={24} /></div><h3 className="text-2xl font-bold mb-4">Web Development</h3><p className="text-zinc-400 leading-relaxed mb-6">Custom-coded React & Next.js applications designed for speed, SEO, and conversion. We don't use templates; we architect experiences.</p><ul className="space-y-2 text-zinc-500"><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> High-Performance Animations</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> CMS Integration</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Dark Mode Optimized</li></ul></Card>
            </FadeIn>
            <FadeIn delay={200}>
              <Card className="group cursor-pointer h-full"><div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-lg"><MessageSquare size={24} /></div><h3 className="text-2xl font-bold mb-4">AI Receptionists</h3><p className="text-zinc-400 leading-relaxed mb-6">Intelligent agents that handle customer support, booking, and inquiries 24/7. Train them on your data and let them run your front desk.</p><ul className="space-y-2 text-zinc-500"><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Natural Language Processing</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Calendar Integration</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Voice & Chat Support</li></ul></Card>
            </FadeIn>
          </div>
        </div>
      </section>
      <section id="portfolio" className="py-16 md:py-24 bg-black border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <FadeIn className="mb-12 md:mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">OUR PORTFOLIO</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-400 max-w-2xl mx-auto">Explore our latest projects showcasing custom web development and AI-powered solutions.</p>
          </FadeIn>

          {/* Portfolio Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Website Projects */}
            <FadeIn delay={100}>
              <a href="https://e-commerce-platform-two-indol.vercel.app/" target="_blank" rel="noopener noreferrer" className="block h-full">
                <Card className="group overflow-hidden cursor-pointer h-full flex flex-col hover:border-blue-500 transition-all">
                  <div className="aspect-video bg-zinc-900 relative overflow-hidden mb-4">
                    <img src="/ecommerce.png" alt="E-Commerce Platform Demo" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold">Website</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">E-Commerce Platform Demo</h3>
                  <p className="text-zinc-400 text-sm mb-4 flex-1">Full-stack React application with payment integration, real-time inventory, and admin dashboard.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">React</span>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Stripe</span>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Firebase</span>
                  </div>
                </Card>
              </a>
            </FadeIn>

            <FadeIn delay={150}>
              <a href="https://saasdashboarddemo.vercel.app/" target="_blank" rel="noopener noreferrer" className="block h-full">
                <Card className="group overflow-hidden cursor-pointer h-full flex flex-col hover:border-blue-500 transition-all">
                  <div className="aspect-video bg-zinc-900 relative overflow-hidden mb-4">
                    <img src="/saasdashboard.png" alt="SaaS Dashboard Demo" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold">Website</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Saas Dashboard Demo</h3>
                  <p className="text-zinc-400 text-sm mb-4 flex-1">Modern analytics platform with data visualization, user management, and API integrations.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Next.js</span>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">TypeScript</span>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Tailwind</span>
                  </div>
                </Card>
              </a>
            </FadeIn>

            <FadeIn delay={200}>
              <a href="https://portfoliodemo-rosy.vercel.app/" target="_blank" rel="noopener noreferrer" className="block h-full">
                <Card className="group overflow-hidden cursor-pointer h-full flex flex-col hover:border-blue-500 transition-all">
                  <div className="aspect-video bg-zinc-900 relative overflow-hidden mb-4">
                    <img src="/portfolio.png" alt="Portfolio Website" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold">Website</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Portfolio Website</h3>
                  <p className="text-zinc-400 text-sm mb-4 flex-1">High-performance creative portfolio with smooth animations and optimized media loading.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">React</span>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Framer Motion</span>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Vite</span>
                  </div>
                </Card>
              </a>
            </FadeIn>

            {/* AI Receptionist Projects */}
            <FadeIn delay={250}>
              <Card className="group overflow-hidden cursor-pointer h-full flex flex-col hover:border-purple-500 transition-all" onClick={() => { console.log("Medical Office AI clicked!"); setShowPhoneDemo(true); }}>
                <div className="aspect-video bg-gradient-to-br from-cyan-900/30 to-blue-900/30 relative overflow-hidden mb-4">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white/10">AI</div>
                  <div className="absolute bottom-0 right-0 bg-purple-600 text-white px-3 py-1 text-xs font-bold">AI Agent</div>
                </div>
                <h3 className="text-xl font-bold mb-2">Medical Office AI</h3>
                <p className="text-zinc-400 text-sm mb-4 flex-1">Appointment booking, patient inquiries, and insurance verification via phone and chat.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">GPT-4</span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Twilio</span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Calendar API</span>
                </div>
              </Card>
            </FadeIn>

            <FadeIn delay={300}>
              <Card className="group overflow-hidden cursor-pointer h-full flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-orange-900/30 to-red-900/30 relative overflow-hidden mb-4">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white/10">AI</div>
                  <div className="absolute bottom-0 right-0 bg-purple-600 text-white px-3 py-1 text-xs font-bold">AI Agent</div>
                </div>
                <h3 className="text-xl font-bold mb-2">Restaurant Chatbot</h3>
                <p className="text-zinc-400 text-sm mb-4 flex-1">24/7 reservation system, menu recommendations, and delivery order processing.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Gemini</span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Voice AI</span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">CRM</span>
                </div>
              </Card>
            </FadeIn>

            <FadeIn delay={350}>
              <Card className="group overflow-hidden cursor-pointer h-full flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-indigo-900/30 to-purple-900/30 relative overflow-hidden mb-4">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white/10">AI</div>
                  <div className="absolute bottom-0 right-0 bg-purple-600 text-white px-3 py-1 text-xs font-bold">AI Agent</div>
                </div>
                <h3 className="text-xl font-bold mb-2">E-Commerce Support</h3>
                <p className="text-zinc-400 text-sm mb-4 flex-1">Product recommendations, order tracking, and return processing automation.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Claude</span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Shopify API</span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Analytics</span>
                </div>
              </Card>
            </FadeIn>
          </div>

          <FadeIn delay={400} className="text-center mt-12">
            <p className="text-zinc-500 mb-6">Want to see your project here?</p>
            <Button variant="primary" onClick={() => onLogin()}>Start Your Project</Button>
          </FadeIn>
        </div>
      </section>
      <section id="demo" className="py-16 md:py-24 relative overflow-hidden bg-black">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 w-full text-center lg:text-left">
            <FadeIn>
              <div className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-bold tracking-widest mb-6 border border-blue-900/50">LIVE PREVIEW</div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">TALK TO THE <br /> MACHINE.</h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto lg:mx-0">Test our AI receptionist instantly. It can answer questions about our pricing, services, and availability. No human required.</p>
              <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-zinc-500"><div className="flex -space-x-3">{[1,2,3].map(i => (<div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-xs text-white">U{i}</div>))}</div><p>Trusted by 50+ agencies</p></div>
            </FadeIn>
          </div>
          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <FadeIn delay={200} className="w-full max-w-md">
              <AIChatDemo />
            </FadeIn>
          </div>
        </div>
      </section>
      <section id="pricing" className="py-16 md:py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <FadeIn className="mb-16 text-center"><h2 className="text-3xl md:text-4xl font-bold mb-4">TRANSPARENT PRICING</h2><p className="text-zinc-400">Invest in your digital infrastructure.</p></FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[{ title: 'Starter', price: '$2,500', sub: 'One-time', features: ['Custom Landing Page', 'Mobile Responsive', 'Basic SEO', '1 Week Support'] }, { title: 'Growth', price: '$4,500', sub: 'One-time', features: ['Multi-page Website', 'CMS Integration', 'Advanced Animations', 'AI Chatbot Setup'] }, { title: 'Agency', price: '$8,000+', sub: 'Custom Quote', features: ['Full Web App', 'User Authentication', 'Payment Integration', 'Custom AI Training'] }].map((tier, index) => (
              <FadeIn key={index} delay={index * 150}><Card className={`relative flex flex-col h-full transform transition-all duration-300 hover:-translate-y-2 ${index === 1 ? 'border-blue-600/50 bg-zinc-900/80 shadow-[0_0_30px_rgba(37,99,235,0.15)]' : 'bg-transparent'}`}>{index === 1 && (<div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded-full shadow-lg">MOST POPULAR</div>)}<h3 className="text-xl font-bold mb-2">{tier.title}</h3><div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold">{tier.price}</span><span className="text-zinc-500 text-sm">{tier.sub}</span></div><div className="space-y-4 mb-8 flex-1">{tier.features.map((f, i) => (<div key={i} className="flex items-center gap-3 text-sm text-zinc-300"><Check size={14} className="text-blue-500 flex-shrink-0" /> {f}</div>))}</div><Button variant={index === 1 ? 'accent' : 'secondary'} className="w-full" onClick={() => onLogin()}>Get Started</Button></Card></FadeIn>
            ))}
          </div>
        </div>
      </section>
      <footer className="py-12 border-t border-zinc-900 text-center md:text-left bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2"><Cpu size={18}/> WEBFRONT AI</div>
          <div className="text-zinc-500 text-sm">© 2026 WebFront AI. Built for the future.</div>
          <div className="flex gap-6 text-zinc-400"><a href="#" className="hover:text-white transition-colors transform hover:scale-110 block">Twitter</a><a href="#" className="hover:text-white transition-colors transform hover:scale-110 block">LinkedIn</a><a href="#" className="hover:text-white transition-colors transform hover:scale-110 block">Instagram</a></div>
        </div>
      </footer>

      {/* Phone Call Demo Modal */}
      <PhoneCallDemo isOpen={showPhoneDemo} onClose={() => setShowPhoneDemo(false)} />
    </div>
  );
}

// ... Client Views (Dashboard, Projects, etc) - No changes required here ...
// [Assume ClientDashboardView, ClientProjectsView, ClientDocumentsView, ClientMessagesView, ClientInvoicesView, ClientKnowledgeBaseView, SettingsView exist as before]

function ClientDashboardView({ data }) {
  // Ensure we are working with the isolated client data passed from ClientPortal
  const invoices = data.invoices || [];
  const allActivity = data.activity || [];

  // Filter activity to only show project-related updates (hide admin actions)
  const activity = allActivity.filter(item => {
    const action = item.action?.toLowerCase() || '';
    // Hide admin/internal actions
    if (action.includes('admin')) return false;
    if (action.includes('role changed')) return false;
    if (action.includes('invoice')) return false;
    if (action.includes('contract uploaded')) return false;
    // Show project-related activity
    return true;
  });

  const totalOpenBalance = invoices.reduce((acc, inv) => {
    if (inv.status === 'Paid') return acc;
    return acc + safeParseAmount(inv.amount);
  }, 0);
  const formattedBalance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalOpenBalance);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3 mb-1"><h1 className="text-3xl font-bold">Welcome back, {data.name || 'User'}</h1><span className={`text-xs uppercase tracking-wider px-2 py-1 rounded-full font-bold border ${data.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{data.status || 'Active'}</span></div>
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/40">{data.name?.charAt(0) || 'U'}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500"><h3 className="text-zinc-400 text-sm mb-1">Project Status</h3><p className="text-xl font-bold truncate">{data.phase || 'N/A'}</p><p className="text-xs text-blue-400 mt-2">{data.progress || 0}% Complete</p></Card>
        <Card><h3 className="text-zinc-400 text-sm mb-1">Next Milestone</h3><p className="text-xl font-bold truncate">{data.milestone || 'N/A'}</p><p className="text-zinc-500 text-xs mt-2">Due: {data.dueDate || 'TBD'}</p></Card>
        <Card><h3 className="text-zinc-400 text-sm mb-1">Open Balance</h3><p className="text-xl font-bold">{formattedBalance}</p><p className={`text-xs mt-2 ${totalOpenBalance > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{totalOpenBalance > 0 ? 'Payment Due' : 'Paid'}</p></Card>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
          {activity.length > 0 ? activity.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors"><div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div><span className="truncate max-w-[200px] sm:max-w-md">{item.action}</span></div><span className="text-zinc-500 text-sm whitespace-nowrap ml-4">{item.date}</span></div>
          )) : <div className="p-4 text-zinc-500 text-center">No recent activity</div>}
        </div>
      </div>
    </div>
  );
}

function ClientProjectsView({ data }) {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="mb-4"><h1 className="text-3xl font-bold mb-1">Active Project</h1><p className="text-zinc-500">{data.project || 'No Active Project'}</p></div>
            <Card className="p-8">
                <div className="flex justify-between items-end mb-6">
                    <div><div className="text-sm text-blue-400 font-bold uppercase tracking-widest mb-1">Current Phase</div><h2 className="text-4xl font-bold text-white">{data.phase || 'Discovery'}</h2></div>
                    <div className="text-right"><div className="text-3xl font-bold text-white">{data.progress || 0}%</div></div>
                </div>
                <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden mb-8"><div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${data.progress || 0}%` }}></div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-800 pt-6">
                    <div><h4 className="text-zinc-500 text-sm mb-1">Next Milestone</h4><p className="text-white font-medium">{data.milestone || 'TBD'}</p></div>
                    <div><h4 className="text-zinc-500 text-sm mb-1">Target Date</h4><p className="text-white font-medium">{data.dueDate || 'TBD'}</p></div>
                    <div><h4 className="text-zinc-500 text-sm mb-1">Status</h4><span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${data.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{data.status === 'Completed' ? <CheckCircle2 size={14}/> : <Activity size={14}/>}{data.status || 'Active'}</span></div>
                </div>
            </Card>
            <div><h3 className="text-xl font-bold mb-4">Project Roadmap</h3><div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-6">{['Discovery', 'Design', 'Development', 'Testing', 'Live'].map((phase, i) => { const isCompleted = (data.progress || 0) > (i + 1) * 20; const isCurrent = data.phase === phase; return (<div key={i} className={`flex items-center gap-4 ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-500 border-green-500 text-black' : isCurrent ? 'border-blue-500 text-blue-500' : 'border-zinc-700 text-zinc-700'}`}>{isCompleted ? <Check size={16}/> : i + 1}</div><div className="flex-1"><h4 className={`font-bold ${isCurrent ? 'text-blue-400' : 'text-white'}`}>{phase}</h4></div></div>)})}</div></div>
        </div>
    );
}

function ClientDocumentsView({ data }) {
  const [uploading, setUploading] = useState(false);
  const handleClientUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 1048576) { alert("File too large for free storage (Max 1MB)."); return; }
    setUploading(true);
    try {
      const base64 = await convertToBase64(file);
      const newDoc = { name: file.name, url: base64, date: new Date().toLocaleDateString(), size: (file.size / 1024).toFixed(2) + " KB" };
      // Update with activity log
      await updateDoc(doc(db, "clients", data.id), { 
        clientUploads: arrayUnion(newDoc),
        activity: arrayUnion({ action: `Client uploaded: ${file.name}`, date: new Date().toLocaleDateString(), status: "Completed" })
      });
      alert("File uploaded successfully!");
    } catch (error) { alert("Upload failed: " + error.message); } finally { setUploading(false); }
  };

  return (
  <div className="animate-fade-in space-y-8">
    <div><h1 className="text-3xl font-bold mb-1">Documents & Files</h1><p className="text-zinc-500">Securely view contracts and share files.</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div><h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400"><FileText size={20}/> Official Documents</h3><div className="space-y-3">{data.contracts && data.contracts.length > 0 ? data.contracts.map((doc, i) => (<div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-all group"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 bg-blue-500/10 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-500"><FileText size={20} /></div><div className="min-w-0"><h3 className="font-bold text-white truncate text-sm">{doc.name}</h3><p className="text-xs text-zinc-500">{doc.date} • {doc.size}</p></div></div><a href={doc.url} download={doc.name} className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded-lg"><Download size={18} /></a></div>)) : <div className="p-6 text-center text-zinc-500 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed text-sm">No documents shared yet.</div>}</div></div>
        <div><h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400"><UploadCloud size={20}/> Your Uploads</h3><div className="bg-zinc-900/30 rounded-xl border border-zinc-800 p-6 mb-4 hover:border-zinc-600 transition-colors"><label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer"><div className="flex flex-col items-center justify-center">{uploading ? <Loader2 className="animate-spin text-blue-500 mb-2"/> : <UploadCloud className="w-8 h-8 text-zinc-500 mb-2" />}<p className="text-sm text-zinc-500">{uploading ? "Uploading..." : "Click to upload file (Max 1MB)"}</p></div><input type="file" className="hidden" onChange={handleClientUpload} disabled={uploading} /></label></div><div className="space-y-3">{data.clientUploads && data.clientUploads.length > 0 ? data.clientUploads.map((doc, i) => (<div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex-shrink-0 flex items-center justify-center"><Check size={18} /></div><div className="min-w-0"><h3 className="font-bold text-white truncate text-sm">{doc.name}</h3><p className="text-xs text-zinc-500">{doc.date} • {doc.size}</p></div></div><a href={doc.url} download={doc.name} className="text-zinc-500 hover:text-white p-2"><Download size={18}/></a></div>)) : null}</div></div>
    </div>
  </div>
  );
}

function ClientMessagesView({ data }) {
    const [messageInput, setMessageInput] = useState("");
    const messages = data.messages || [{ sender: 'admin', text: 'Welcome to your portal! Let us know if you have questions.', time: 'System • Just now' }];
    const handleSendMessage = async (e) => { e.preventDefault(); if (!messageInput.trim()) return; try { await updateDoc(doc(db, "clients", data.id), { messages: arrayUnion({ sender: 'client', text: messageInput, time: new Date().toLocaleString() }) }); setMessageInput(""); } catch (err) { console.error("Message failed", err); } };
    return (
        <div className="animate-fade-in h-full flex flex-col"><div className="mb-4"><h1 className="text-3xl font-bold mb-1">Messages</h1><p className="text-zinc-500">Direct line to your project manager.</p></div><div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-[500px]"><div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">{messages.map((msg, i) => (<div key={i} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'client' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'}`}><p className="text-sm">{msg.text}</p><p className={`text-[10px] mt-2 ${msg.sender === 'client' ? 'text-blue-200' : 'text-zinc-500'}`}>{msg.time}</p></div></div>))}</div><form onSubmit={handleSendMessage} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2"><input className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Type your message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)}/><button type="submit" disabled={!messageInput.trim()} className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 disabled:opacity-50"><Send size={20}/></button></form></div></div>
    );
}

function ClientInvoicesView({ data }) {
  // Use data.invoices to ensure we only show the current client's invoices
  const invoices = data.invoices || [];
  
  return (<div className="animate-fade-in"><div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"><div><h1 className="text-3xl font-bold mb-1">Invoices</h1><p className="text-zinc-500">View payment history and upcoming charges.</p></div><Button variant="secondary" className="px-4 py-2 text-xs w-full sm:w-auto">Download CSV</Button></div><div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto"><div className="min-w-[600px]"><div className="grid grid-cols-4 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50"><div>Description</div><div>Date</div><div className="text-right">Amount</div></div>{invoices.length > 0 ? invoices.map((inv, i) => (<div key={i} className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors items-center"><div className="col-span-2 min-w-0"><div className="font-bold truncate pr-4">{inv.desc}</div><div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">{inv.id} <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${inv.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{inv.status}</span></div></div><div className="text-zinc-400 text-sm">{inv.date}</div><div className="text-right font-mono">{inv.amount}</div></div>)) : <div className="p-12 text-center text-zinc-500">No invoices found.</div>}</div></div></div>);
}

function ClientKnowledgeBaseView() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (id) => {
        setOpenIndex(openIndex === id ? null : id);
    };

    const categories = [
        {
            title: "General",
            items: [
                { q: "What does WebFront AI do?", a: "WebFront AI builds high-performance business websites and deploys AI receptionists that handle customer questions, bookings, and support 24/7. We help businesses automate operations, improve conversions, and look more professional online." },
                { q: "Who is WebFront AI for?", a: "Our services are designed for small businesses, startups, agencies, creators, and service-based companies who want modern websites, automation tools, and an AI assistant that reduces workload." },
                { q: "Do you use templates?", a: "No. All websites are custom-coded using React/Next.js. Every build is optimized for speed, SEO, animations, and user experience." }
            ]
        },
        {
            title: "AI Receptionist",
            items: [
                { q: "What is an AI receptionist?", a: "An AI receptionist is a smart, conversational agent that can answer customer questions, book appointments, qualify leads, and respond instantly on your website—without human involvement." },
                { q: "What can the AI receptionist do?", a: "It can:\n• Answer questions about your business\n• Manage customer support\n• Take messages and qualify leads\n• Explain pricing/services\n• Connect to your calendar\n• Respond via chat or voice (depending on setup)\n• Run 24/7" },
                { q: "Can the AI be trained on my business information?", a: "Yes. We train your AI using your website, FAQs, documents, menus, policies, pricing sheets, and more. You stay in control of what it knows." },
                { q: "Is the AI secure?", a: "Yes. The system protects your data, and clients only see what you allow. The AI never reveals private information, internal notes, admin data, or anything not meant for public use." }
            ]
        },
        {
            title: "Website Development",
            items: [
                { q: "What kind of websites do you build?", a: "We build:\n• One-page landing pages\n• Multi-page business websites\n• Full custom web applications\n• Dark-mode experiences\n• CMS-powered sites\n• Sites with advanced animations\n• Apps with user authentication and payments" },
                { q: "How long does a project take?", a: "Most projects take:\n• Starter Website: 5–10 days\n• Growth Website: 2–3 weeks\n• Full Web App: Timeline based on scope" },
                { q: "Can you integrate payments, bookings, or custom features?", a: "Yes. We can integrate Stripe, scheduling systems, dashboards, member-only portals, and more." }
            ]
        },
        {
            title: "Pricing & Packages",
            items: [
                { q: "How much does a website cost?", a: "We offer three tiers:\n• Starter – $2,500: Custom landing page, Mobile responsive, Basic SEO, 1 week support\n• Growth – $4,500: Multi-page website, CMS, animations, AI setup\n• Agency – $8,000+ : Full custom web app with payments, authentication, and AI training" },
                { q: "Do you offer monthly plans?", a: "Yes. Maintenance, updates, hosting, and AI support can be added as a recurring plan if needed." },
                { q: "Is pricing transparent?", a: "Always. You will see a full breakdown, contract, and project scope before work begins. No hidden fees." }
            ]
        },
        {
            title: "Project Management",
            items: [
                { q: "How do I track my project’s progress?", a: "You get access to the WebFront OS dashboard, where you can view:\n• Your project pipeline stage\n• Daily progress updates\n• Files, invoices, and deliverables\n• Activity logs" },
                { q: "Can I see examples of previous projects?", a: "Yes, upon request we can show client demos, templates, and completed sites." }
            ]
        },
        {
            title: "AI & Data Security",
            items: [
                { q: "Where is my data stored?", a: "All data is securely stored within your account on WebFront OS. You can view your logs, user roles, invoices, and AI configurations anytime." },
                { q: "Does the AI ever reveal private business info?", a: "No. The AI is restricted from discussing:\n• Admin data\n• Financials\n• Internal notes\n• Other clients\n• System logs\n• Emails or sensitive info\nIt only speaks about your business publicly-approved information." },
                { q: "Can I modify what the AI knows?", a: "Yes. You can upload or remove knowledge sources anytime (PDFs, docs, websites, etc.)." }
            ]
        },
        {
            title: "Onboarding & Setup",
            items: [
                { q: "How does onboarding work?", a: "1. Choose your package\n2. Complete the onboarding form\n3. Upload any content or branding\n4. We build your website or AI system\n5. You get access to your dashboard to watch progress in real time" },
                { q: "How do I add my business information to the AI?", a: "Inside Documents, you can upload documents, FAQs, URLs, or custom instructions." }
            ]
        },
        {
            title: "Billing & Financials",
            items: [
                { q: "How do payments work?", a: "Invoices are sent directly through the WebFront OS financial dashboard. Payments can be made online via card, bank transfer, or approved methods." },
                { q: "Can I view all my invoices later?", a: "Yes. All past and active invoices are stored in your client dashboard under Financials." },
                { q: "Are refunds available?", a: "Refunds depend on the project stage and are evaluated on a case-by-case basis." }
            ]
        },
        {
            title: "Support & Maintenance",
            items: [
                { q: "Do you offer ongoing updates?", a: "Yes. We offer optional support plans that include:\n• AI model updates\n• Website improvements\n• Bug fixes\n• Content changes\n• Performance optimization" },
                { q: "How do I contact support?", a: "You can reach us through the email listed in your dashboard or by messaging through the Messages Tab." }
            ]
        },
        {
            title: "Technical",
            items: [
                { q: "Can I connect third-party tools?", a: "Absolutely. We integrate CRMs, payment providers, booking systems, automations, and custom APIs." }
            ]
        }
    ];

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-1">Knowledge Base</h1>
                <p className="text-zinc-500">Frequently asked questions and guides.</p>
            </div>
            
            <div className="space-y-10 pb-12">
                {categories.map((cat, catIndex) => (
                    <div key={catIndex} className="animate-fade-in-up" style={{ animationDelay: `${catIndex * 100}ms` }}>
                        <h2 className="text-xl font-bold text-blue-400 mb-4 px-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {cat.title}
                        </h2>
                        <div className="space-y-3">
                            {cat.items.map((item, index) => {
                                const uniqueIndex = `${catIndex}-${index}`;
                                const isOpen = openIndex === uniqueIndex;
                                return (
                                    <div 
                                        key={index} 
                                        onClick={() => toggle(uniqueIndex)}
                                        className={`bg-zinc-900/30 border ${isOpen ? 'border-blue-500/50 bg-zinc-900/50 shadow-lg shadow-blue-900/10' : 'border-zinc-800'} p-6 rounded-xl cursor-pointer transition-all duration-200 hover:border-zinc-700`}
                                    >
                                        <div className="flex justify-between items-center gap-4">
                                            <h3 className={`font-bold text-white flex items-start gap-3 ${isOpen ? 'text-blue-200' : ''}`}>
                                                <HelpCircle size={20} className="text-blue-500 mt-0.5 flex-shrink-0"/> 
                                                {item.q}
                                            </h3>
                                            <ChevronDown size={20} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                                        </div>
                                        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                                            <div className="overflow-hidden">
                                                <div className="text-zinc-400 text-sm pl-8 leading-relaxed whitespace-pre-line border-t border-zinc-800/50 pt-4">
                                                    {item.a}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SettingsView({ data, onUpdateClient, onDeleteAccount }) {
  const [name, setName] = useState(data?.name || "");
  const handleSave = () => { onUpdateClient({ ...data, name }); };
  return (<div className="animate-fade-in"><div className="mb-8"><h1 className="text-3xl font-bold mb-1">Settings</h1><p className="text-zinc-500">Manage your account preferences.</p></div><div className="grid gap-8 max-w-2xl"><div className="space-y-4"><h3 className="text-lg font-bold flex items-center gap-2"><User size={18}/> Profile Details</h3><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-zinc-500 mb-1">Company / Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-base md:text-sm text-white focus:border-blue-500 focus:outline-none" /></div><div><label className="block text-xs font-medium text-zinc-500 mb-1">Email (Locked)</label><input type="text" value={data?.email || ""} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-base md:text-sm text-zinc-500 cursor-not-allowed" /></div></div><Button onClick={handleSave} className="text-sm py-2 px-4">Save Changes</Button></div><div className="space-y-4 pt-4 border-t border-zinc-800"><h3 className="text-lg font-bold flex items-center gap-2 text-red-500"><Shield size={18}/> Danger Zone</h3><Button onClick={() => onDeleteAccount(data?.id)} variant="danger" className="w-full justify-start">Delete My Account</Button></div></div></div>);
}

function AdminDataAIView() {
    // State now initializes with a placeholder for geminiKey
    const [config, setConfig] = useState({
        activeModel: 'gemini', 
        geminiKey: '', // Added field for the key
        systemPrompt: "You are WEBFRONT_AI, a helpful assistant for digital agencies. Always be concise and professional.",
        knowledgeSources: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "admin", "ai_settings");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setConfig(prev => ({ 
                        ...prev, 
                        ...data,
                        // Optional: If you want to mask the key on load so it isn't fully visible
                        // geminiKey: data.geminiKey ? '••••••••••••••••' : '' 
                    }));
                }
            } catch (error) {
                console.error("Error fetching AI settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "admin", "ai_settings"), config, { merge: true });
            alert("AI Configuration Saved Successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // ... handleAddSource and handleRemoveSource remain the same ...
    const handleAddSource = () => {
        const name = prompt("Enter Knowledge Source Name (e.g., 'Q3 Financial Report'):");
        if (!name) return;
        const type = prompt("Enter Source Type (e.g., 'File', 'Notion', 'Website'):", "File");
        
        const newSource = {
            id: Date.now(), 
            name,
            type: type || "Custom",
            lastSynced: new Date().toLocaleDateString(),
            status: "Active"
        };

        setConfig(prev => ({
            ...prev,
            knowledgeSources: [...(prev.knowledgeSources || []), newSource]
        }));
    };

    const handleRemoveSource = (id) => {
        if (!confirm("Are you sure you want to remove this data source? This cannot be undone.")) return;
        setConfig(prev => ({
            ...prev,
            knowledgeSources: prev.knowledgeSources.filter(s => s.id !== id)
        }));
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto"/> Loading AI Settings...</div>;

    return (
        <div className="animate-fade-in max-w-4xl">
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Data & AI Models</h1>
                    <p className="text-zinc-500">Configure LLM parameters and manage knowledge sources.</p>
                </div>
                <Button variant="primary" onClick={handleSave} disabled={saving} className="shadow-blue-900/20">
                    {saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>} 
                    {saving ? "Saving..." : "Save Configuration"}
                </Button>
            </div>
            
            <div className="grid gap-8">
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                        <Brain size={20} className="text-purple-500"/> Model Configuration
                    </h3>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Primary LLM Provider</label>
                            <select 
                                value={config.activeModel}
                                onChange={(e) => setConfig({...config, activeModel: e.target.value})}
                                className="w-full bg-blackHv border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:border-purple-500 outline-noneKP transition-colors"
                            >
                                <option value="gemini">Google Gemini 1.5 Flash</option>
                                <option value="openai">OpenAI GPT-4o</option>
                            </select>
                        </div>

                        {/* --- ADDED: Gemini API Key Input --- */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Gemini API Key</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={config.geminiKey || ''}
                                    onChange={(e) => setConfig({...config, geminiKey: e.target.value})}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:border-purple-500 outline-none transition-colors"
                                    placeholder="AIzaSy..."
                                />
                                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">
                                stored securely in Firestore (admin only).
                            </p>
                        </div>
                        {/* ----------------------------------- */}

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">System Prompt (Global)</label>
                            <textarea 
                                className="w-full h-32 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:border-purple-500 outline-none font-mono leading-relaxed" 
                                value={config.systemPrompt}
                                onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                                placeholder="Define the AI's persona and rules..."
                            />
                        </div>
                    </div>
                </div>

                {/* Knowledge Sources Section (Unchanged) */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Database size={20} className="text-blue-500"/> Knowledge Sources
                        </h3>
                        <Button variant="secondary" onClick={handleAddSource} className="py-2 px-4 text-xs h-auto border-dashed border-zinc-700 hover:border-blue-500 hover:text-blue-400">
                            <Plus size={14} className="mr-1"/> Add Source
                        </Button>
                    </div>
                    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-black/20">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-900/80 text-zinc-400 font-medium">
                                <tr>
                                    <th className="p-4">Source Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Last Synced</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {config.knowledgeSources && config.knowledgeSources.length > 0 ? (
                                    config.knowledgeSources.map((source) => (
                                        <tr key={source.id} className="group hover:bg-zinc-800/30 transition-colors">
                                            <td className="p-4 font-medium text-white">{source.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${source.type === 'Scraper' ? 'bg-blue-900/30 text-blue-400' : 'bg-orange-900/30 text-orange-400'}`}>
                                                    {source.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-zinc-500">{source.lastSynced}</td>
                                            <td className="p-4">
                                                <span className="text-green-500 text-xs flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {source.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleRemoveSource(source.id)} 
                                                    className="text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                                    title="Remove Source"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-zinc-500">
                                            No knowledge sources added yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
// ... Admin Views (AdminDashboardView, AdminPipelineView, etc) ...
// ... AdminReportsView, AdminActivityLogsView, AdminGlobalSettingsView, AdminClientsManager, AdminUsersManager, AdminFinancialsView, AdminPortal ...
// [Assume these components are unchanged from your original upload]

// [RE-INSERTING Unchanged Components for completeness so the file is runnable]
function AdminDashboardView({ clients, onNavigateToTasks }) {
  // Helper to parse amounts safely
  const parseAmount = (amt) => {
      if (typeof amt === 'number') return amt;
      if (typeof amt === 'string') return parseFloat(amt.replace(/[^0-9.-]+/g, "")) || 0;
      return 0;
  };

  // Calculate Real-Time Stats from the 'clients' prop
  const totalRevenue = clients.reduce((sum, c) => sum + (c.invoices?.filter(i => i.status === 'Paid').reduce((s, i) => s + parseAmount(i.amount), 0) || 0), 0);
  const activeProjects = clients.filter(c => c.status === 'Active').length;
  const pendingTasks = clients.reduce((sum, c) => sum + (c.tasks?.filter(t => !t.completed).length || 0), 0);
  
  // Aggregate recent global activity from all clients
  const recentActivity = clients
    .flatMap(c => (c.activity || []).map(a => ({ ...a, clientName: c.name, clientId: c.id })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-1">Agency Overview</h1>
        <p className="text-zinc-500">Real-time insights into agency performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
           <h3 className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><DollarSign size={14}/> Total Revenue</h3>
           <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
           <h3 className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><Briefcase size={14}/> Active Projects</h3>
           <p className="text-2xl font-bold text-white">{activeProjects}</p>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
           <h3 className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><Users size={14}/> Total Clients</h3>
           <p className="text-2xl font-bold text-white">{clients.length}</p>
        </Card>
        <Card
          className="border-l-4 border-l-yellow-500 cursor-pointer hover:bg-zinc-800/50 transition-colors group"
          onClick={onNavigateToTasks}
        >
           <h3 className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><ListTodo size={14}/> Pending Tasks</h3>
           <p className="text-2xl font-bold text-white flex items-center gap-2">
             {pendingTasks}
             <ArrowRight size={16} className="text-zinc-600 group-hover:text-yellow-400 transition-colors" />
           </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-blue-400"/> Global Activity Feed</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((act, i) => (
              <div key={i} className="flex items-start gap-3 text-sm pb-3 border-b border-zinc-800 last:border-0 last:pb-0">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-zinc-300"><span className="font-bold text-white">{act.clientName}</span>: {act.action}</p>
                  <p className="text-xs text-zinc-500">{act.date}</p>
                </div>
              </div>
            )) : <p className="text-zinc-500 text-sm">No recent activity.</p>}
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-400"/> Revenue Targets</h3>
          <div className="space-y-6">
             <div>
               <div className="flex justify-between text-sm mb-2"><span className="text-zinc-400">Monthly Goal ($50k)</span><span className="text-white font-bold">{Math.min(100, (totalRevenue / 50000) * 100).toFixed(0)}%</span></div>
               <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden"><div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (totalRevenue / 50000) * 100)}%` }}></div></div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-2"><span className="text-zinc-400">Total Clients</span><span className="text-white font-bold">{clients.length}</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPipelineView({ clients }) {
  const phases = ['Discovery', 'Design', 'Development', 'Testing', 'Live'];
  
  const handlePhaseChange = async (clientId, newPhase) => {
    try {
        const progressMap = { 'Discovery': 10, 'Design': 30, 'Development': 60, 'Testing': 90, 'Live': 100 };
        const newProgress = progressMap[newPhase] || 0;
        const status = newPhase === 'Live' ? 'Completed' : 'Active';
        
        await updateDoc(doc(db, "clients", clientId), { 
            phase: newPhase, 
            progress: newProgress,
            status: status,
            activity: arrayUnion({ action: `Phase advanced to ${newPhase}`, date: new Date().toLocaleDateString(), status: "Completed" })
        });
    } catch (e) {
        console.error("Error updating phase:", e);
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="mb-6"><h1 className="text-3xl font-bold mb-1">Projects Pipeline</h1><p className="text-zinc-500">Drag and drop management of client lifecycles.</p></div>
       <div className="flex-1 overflow-x-auto pb-4">
         <div className="flex gap-6 min-w-[1200px] h-full">
            {phases.map(phase => (
                <div key={phase} className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-xl flex flex-col min-w-[280px]">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 rounded-t-xl flex justify-between items-center">
                        <h3 className="font-bold text-white">{phase}</h3>
                        <span className="bg-zinc-800 text-xs px-2 py-1 rounded-full text-zinc-400">{clients.filter(c => c.phase === phase).length}</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                        {clients.filter(c => c.phase === phase).map(client => (
                            <div key={client.id} className="bg-black border border-zinc-700 p-4 rounded-lg shadow-sm hover:border-blue-500 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white truncate max-w-[150px]">{client.name}</h4>
                                    <div className="relative group/edit">
                                        <button className="text-zinc-500 hover:text-white"><Edit3 size={14}/></button>
                                        <div className="absolute right-0 top-6 w-32 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1 z-10 hidden group-hover/edit:block">
                                            {phases.map(p => (
                                                <button key={p} onClick={() => handlePhaseChange(client.id, p)} className="w-full text-left text-xs p-2 hover:bg-zinc-800 text-zinc-300 rounded block">{p}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 mb-3 truncate">{client.project}</p>
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-2"><div className="bg-blue-600 h-full rounded-full" style={{width: `${client.progress}%`}}></div></div>
                                <div className="flex justify-between text-[10px] text-zinc-400">
                                    <span>{client.progress}%</span>
                                    <span>{client.status}</span>
                                </div>
                            </div>
                        ))}
                        {clients.filter(c => c.phase === phase).length === 0 && (
                            <div className="text-center py-8 text-zinc-600 text-sm border-2 border-dashed border-zinc-800 rounded-lg">No Projects</div>
                        )}
                    </div>
                </div>
            ))}
         </div>
       </div>
    </div>
  );
}

function AdminReportsView({ clients }) {
  const generateCSV = () => {
      const headers = "Client,Project,Phase,Revenue,Status\n";
      const rows = clients.map(c => `${c.name},${c.project},${c.phase},${c.revenue || 0},${c.status}`).join("\n");
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agency_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
  };

  return (
    <div className="animate-fade-in max-w-5xl">
       <div className="mb-8"><h1 className="text-3xl font-bold mb-1">Reporting Tools</h1><p className="text-zinc-500">Export data and generate performance summaries.</p></div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <Card className="hover:border-green-500/50 cursor-pointer transition-colors group">
               <div className="w-12 h-12 bg-green-900/20 text-green-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileSpreadsheet size={24}/></div>
               <h3 className="text-xl font-bold mb-2">Financial Report</h3>
               <p className="text-zinc-400 text-sm mb-6">Detailed breakdown of all invoices, revenue by client, and outstanding balances.</p>
               <Button variant="secondary" className="w-full" onClick={generateCSV}>Download CSV</Button>
           </Card>
           
           <Card className="hover:border-blue-500/50 cursor-pointer transition-colors group">
               <div className="w-12 h-12 bg-blue-900/20 text-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Briefcase size={24}/></div>
               <h3 className="text-xl font-bold mb-2">Project Velocity</h3>
               <p className="text-zinc-400 text-sm mb-6">Analysis of project completion rates, phase duration, and bottlenecks.</p>
               <Button variant="secondary" className="w-full">Generate PDF</Button>
           </Card>
       </div>
    </div>
  );
}

function AdminActivityLogsView({ clients }) {
    const allLogs = clients
        .flatMap(c => (c.activity || []).map(a => ({
            id: c.id + a.date + a.action, 
            client: c.name,
            role: c.role === 'admin' ? 'Admin' : 'Client',
            action: a.action,
            date: a.date,
            status: a.status
        })))
        // Simple string sort; for production, ensure 'date' is stored as ISO or timestamp
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="animate-fade-in">
             <div className="mb-8"><h1 className="text-3xl font-bold mb-1">Activity Logs</h1><p className="text-zinc-500">System-wide audit trail for compliance and security.</p></div>
             
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-900 text-zinc-400">
                        <tr><th className="p-4">Timestamp</th><th className="p-4">User</th><th className="p-4">Action</th><th className="p-4 text-right">Result</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {allLogs.length > 0 ? allLogs.map((log, i) => (
                            <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="p-4 font-mono text-zinc-500 text-xs">{log.date}</td>
                                <td className="p-4 font-medium text-white">{log.client} <span className="text-zinc-500 text-xs font-normal">({log.role})</span></td>
                                <td className="p-4 text-zinc-300">{log.action}</td>
                                <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${log.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{log.status || 'Info'}</span>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="4" className="p-8 text-center text-zinc-500">No logs found.</td></tr>}
                    </tbody>
                </table>
             </div>
        </div>
    );
}

function AdminGlobalSettingsView({ settings, onUpdateSettings }) {
    const [config, setConfig] = useState(settings);

    const handleSave = () => {
        onUpdateSettings(config);
        alert("System settings saved.");
    };

    return (
        <div className="animate-fade-in max-w-3xl">
             <div className="mb-8"><h1 className="text-3xl font-bold mb-1">System Configuration</h1><p className="text-zinc-500">Global settings for the WebFront OS.</p></div>
             
             <div className="space-y-6">
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20}/> General Settings</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Platform Name</label>
                            <input type="text" value="WebFront OS" disabled className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-zinc-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Admin Email Notification</label>
                            <input type="text" value={config.email} onChange={(e) => setConfig({...config, email: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:border-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500"><Shield size={20}/> Security & Maintenance</h3>
                     <div className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/30 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-white font-bold flex items-center gap-2"><Power size={16}/> Maintenance Mode</span>
                            <span className="text-xs text-zinc-400">Prevents client logins. Admin access only.</span>
                        </div>
                        <div onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${config.maintenanceMode ? 'bg-red-600' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>

                <Button variant="primary" onClick={handleSave}>Save Configuration</Button>
             </div>
        </div>
    );
}

function AdminClientsManager({ clients }) {
  const actualClients = clients.filter(c => c.role !== 'admin');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const selectedClient = actualClients.find(c => c.id === selectedClientId);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', project: '', phase: 'Discovery', progress: 0 });
  const [newInvoiceData, setNewInvoiceData] = useState({ desc: '', amount: '' });
  const [contractUploading, setContractUploading] = useState(false);
  
  // --- Chat State ---
  const [adminMessageInput, setAdminMessageInput] = useState("");
  const chatScrollRef = useRef(null);

  // --- Auto-scroll chat ---
  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedClient?.messages, selectedClientId]);

  const handleCreateClient = async (e) => {
      e.preventDefault();

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();

      try {
          // Create Firebase Auth user with temp password
          const { user } = await createUserWithEmailAndPassword(auth, newClientData.email, tempPassword);

          // Create Firestore document
          const clientData = {
              id: user.uid,
              ...newClientData,
              role: 'client',
              milestone: "Project Start",
              dueDate: "TBD",
              status: "Active",
              requiresPasswordReset: true, // Flag for first-time login
              activity: [{ action: "Account created by Admin", date: new Date().toLocaleDateString(), status: "Completed" }],
              contracts: [],
              invoices: [],
              tasks: [],
              clientUploads: [],
              notifications: { email: true, push: false },
              messages: []
          };

          await setDoc(doc(db, 'clients', user.uid), clientData);

          // Send invitation email via Cloud Function
          const sendInvite = httpsCallable(functions, 'sendClientInvitation');
          const result = await sendInvite({
              email: newClientData.email,
              name: newClientData.name,
              tempPassword: tempPassword
          });

          if (result.data.testMode) {
              alert(`Client created!\n\nEmail not configured. Share these credentials:\n\nEmail: ${newClientData.email}\nPassword: ${tempPassword}\n\nThey'll be prompted to reset on first login.`);
          } else {
              alert("Client created and invitation email sent!");
          }

          setIsAddingNew(false);
          setNewClientData({ name: '', email: '', project: '', phase: 'Discovery', progress: 0 });
      } catch (err) {
          console.error("Client creation error:", err);
          if (err.code === 'auth/email-already-in-use') {
              alert("This email is already registered.");
          } else {
              alert("Error: " + err.message);
          }
      }
  };

  const handleDeleteClient = async (id) => { 
      if (confirm("Remove client?")) { 
          try { 
              await deleteDoc(doc(db, "clients", id)); 
              setSelectedClientId(null); 
          } catch(err) { alert(err.message); } 
      } 
  };

  const handleUpdateClient = async (field, value) => { 
      try { 
          const updates = { [field]: value }; 
          if (field === 'progress') { updates.status = value === 100 ? 'Completed' : 'Active'; } 
          await updateDoc(doc(db, "clients", selectedClient.id), {
              ...updates,
              activity: arrayUnion({ action: `Updated ${field} to ${value}`, date: new Date().toLocaleDateString(), status: "Completed" })
          }); 
      } catch (err) { console.error(err); } 
  };

  const handleAddInvoice = async () => { 
      if(!newInvoiceData.amount || !newInvoiceData.desc) return; 
      try { 
          await updateDoc(doc(db, "clients", selectedClient.id), { 
              invoices: arrayUnion({ id: `INV-${Math.floor(Math.random()*10000)}`, desc: newInvoiceData.desc, amount: `$${newInvoiceData.amount}`, date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}), status: "Pending" }),
              activity: arrayUnion({ action: `Invoice created: ${newInvoiceData.desc} ($${newInvoiceData.amount})`, date: new Date().toLocaleDateString(), status: "Pending" })
          }); 
          setNewInvoiceData({ desc: '', amount: '' }); 
      } catch (err) { alert(err.message); } 
  };

  const handleMarkPaid = async (i) => { 
      const updated = [...selectedClient.invoices]; 
      updated[i].status = "Paid"; 
      try { 
          await updateDoc(doc(db, "clients", selectedClient.id), { 
              invoices: updated,
              activity: arrayUnion({ action: `Invoice paid: ${updated[i].desc}`, date: new Date().toLocaleDateString(), status: "Completed" })
          }); 
      } catch(e) { console.error(e); } 
  };

  const handleUploadContract = async (e) => { 
      const file = e.target.files[0]; if(!file) return; 
      if (file.size > 1048576) { alert("File too large for free storage (Max 1MB)."); return; } 
      setContractUploading(true); 
      try { 
          const base64 = await convertToBase64(file); 
          const contract = { name: file.name, url: base64, date: new Date().toLocaleDateString(), size: (file.size/1024).toFixed(2)+" KB" }; 
          await updateDoc(doc(db, "clients", selectedClient.id), { 
              contracts: arrayUnion(contract),
              activity: arrayUnion({ action: `Contract uploaded: ${file.name}`, date: new Date().toLocaleDateString(), status: "Completed" })
          }); 
      } catch(err) { alert("Upload failed: " + err.message); } finally { setContractUploading(false); } 
  };

  // --- Admin Send Message Handler ---
  const handleAdminSendMessage = async (e) => {
    e.preventDefault();
    if (!adminMessageInput.trim()) return;
    try {
        await updateDoc(doc(db, "clients", selectedClient.id), {
            messages: arrayUnion({ sender: 'admin', text: adminMessageInput, time: new Date().toLocaleString() }),
            activity: arrayUnion({ action: "Admin sent message", date: new Date().toLocaleDateString(), status: "Completed" })
        });
        setAdminMessageInput("");
    } catch (err) {
        console.error("Message failed", err);
        alert("Failed to send message.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in items-start">
      {/* Client List Sidebar */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 h-[300px] lg:h-full flex-shrink-0">
        <Button variant="accent" className="w-full justify-center py-4 rounded-xl shadow-blue-900/30" onClick={() => { setIsAddingNew(true); setSelectedClientId(null); }}><Plus size={18} /> Add New Client</Button>
        <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-xl overflow-hidden overflow-y-auto custom-scrollbar">
          {actualClients.map(client => (
            <div key={client.id} onClick={() => { setSelectedClientId(client.id); setIsAddingNew(false); }} className={`p-5 border-b border-zinc-800/80 cursor-pointer transition-all duration-200 group ${selectedClient?.id === client.id ? 'bg-blue-900/10 border-l-4 border-l-blue-500 pl-4' : 'hover:bg-zinc-800/40 border-l-4 border-l-transparent hover:border-l-zinc-700'}`}>
              <div className="flex justify-between items-start mb-1"><span className={`font-bold text-lg truncate ${selectedClient?.id === client.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{client.name}</span><span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold border ${client.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{client.status || 'Active'}</span></div><p className="text-sm text-zinc-500 mb-3 truncate group-hover:text-zinc-400">{client.project}</p><div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden"><div className={`h-full rounded-full ${client.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${client.progress}%` }}></div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Details View */}
      <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 h-full w-full overflow-y-auto shadow-2xl relative custom-scrollbar">
        {isAddingNew && (<div className="animate-fade-in max-w-xl mx-auto mt-10"><div className="text-center mb-10"><div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30"><Users size={32}/></div><h2 className="text-3xl font-bold text-white">Onboard New Client</h2><p className="text-zinc-500 mt-2">Create a secure workspace.</p></div><form onSubmit={handleCreateClient} className="space-y-6"><div className="space-y-4"><div><label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Company</label><input required className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-base md:text-sm text-white" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} placeholder="e.g. Acme Corp"/></div><div><label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Email</label><input required className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-base md:text-sm text-white" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} placeholder="client@acme.com"/></div><div><label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Project</label><input required className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-base md:text-sm text-white" value={newClientData.project} onChange={e => setNewClientData({...newClientData, project: e.target.value})} placeholder="e.g. Website Redesign"/></div></div><div className="pt-6 flex gap-3"><Button variant="secondary" className="flex-1 py-3" onClick={() => setIsAddingNew(false)}>Cancel</Button><Button type="submit" variant="success" className="flex-[2] py-3 font-bold">Create</Button></div></form></div>)}
        
        {selectedClient && !isAddingNew && (
           <div className="animate-fade-in space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-zinc-800 pb-8 gap-4"><div><div className="flex items-center gap-3 mb-1"><h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">{selectedClient.name}</h2><button onClick={() => handleDeleteClient(selectedClient.id)} className="text-zinc-600 hover:text-red-500 p-2 hover:bg-zinc-800 rounded-lg"><Trash2 size={20} /></button></div><p className="text-zinc-400 flex items-center gap-2 text-sm"><Mail size={14}/> {selectedClient.email}</p></div><div className="flex items-center gap-4 self-end sm:self-center"><div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedClientId(null)}><Check size={16}/></div></div></div>
              
              {/* Status Board */}
              <div className="bg-black/40 rounded-2xl border border-zinc-800/50 p-1">
                <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Briefcase size={16} className="text-purple-500"/> Project Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block font-medium ml-1">Current Phase</label>
                      <div className="relative w-full">
                        <select value={selectedClient.phase} onChange={(e) => handleUpdateClient('phase', e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white appearance-none focus:outline-none focus:border-purple-500">
                          <option>Discovery</option><option>Design</option><option>Development</option><option>Testing</option><option>Live</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16}/>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block font-medium ml-1 flex justify-between">
                        <span>Completion</span><span className="text-white font-bold">{selectedClient.progress}%</span>
                      </label>
                      <div className="h-12 flex items-center px-1">
                        <input type="range" min="0" max="100" value={selectedClient.progress} onChange={(e) => handleUpdateClient('progress', parseInt(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg accent-blue-500"/>
                      </div>
                    </div>
                    {/* ADDED: Next Milestone Input */}
                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block font-medium ml-1">Next Milestone</label>
                      <input 
                        type="text" 
                        value={selectedClient.milestone || ''} 
                        onChange={(e) => handleUpdateClient('milestone', e.target.value)} 
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Homepage Design"
                      />
                    </div>
                    {/* ADDED: Due Date Input */}
                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block font-medium ml-1">Due Date</label>
                      <input 
                        type="text" 
                        value={selectedClient.dueDate || ''} 
                        onChange={(e) => handleUpdateClient('dueDate', e.target.value)} 
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Oct 24, 2025"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Grid: Invoices & Contracts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 flex flex-col h-full"><div className="flex items-center justify-between mb-6"><h3 className="font-bold flex items-center gap-2 text-green-400"><DollarSign size={18}/> Invoices</h3></div><div className="flex-1 space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">{selectedClient.invoices?.map((inv, i) => (<div key={i} className="flex justify-between items-center text-sm p-3 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors"><div className="min-w-0 pr-2"><div className="text-white font-medium truncate">{inv.desc}</div><div className="text-zinc-600 text-xs">{inv.id} • {inv.date}</div></div><div className="flex items-center gap-3 flex-shrink-0"><div className="text-right"><div className="font-mono text-zinc-300">{inv.amount}</div><span className={`text-[10px] font-bold ${inv.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{inv.status}</span></div>{inv.status !== 'Paid' && (<button onClick={() => handleMarkPaid(i)} className="bg-green-500/20 hover:bg-green-500/40 text-green-500 p-1.5 rounded-full"><CheckCircle2 size={16} /></button>)}</div></div>))}</div><div className="pt-4 border-t border-zinc-800"><div className="flex gap-2 flex-col sm:flex-row"><div className="flex-1 space-y-2 min-w-0"><input type="text" placeholder="Description" value={newInvoiceData.desc} onChange={e => setNewInvoiceData({...newInvoiceData, desc: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-base md:text-sm text-white focus:border-green-500 outline-none truncate"/><div className="flex gap-2"><input type="number" placeholder="$ Amount" value={newInvoiceData.amount} onChange={e => setNewInvoiceData({...newInvoiceData, amount: e.target.value})} className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-base md:text-sm text-white focus:border-green-500 outline-none min-w-0"/><Button variant="success" className="px-4 py-2" onClick={handleAddInvoice}><Send size={16}/></Button></div></div></div></div></div>
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 flex flex-col h-full"><div className="flex items-center justify-between mb-6"><h3 className="font-bold flex items-center gap-2 text-blue-400"><FileText size={18}/> Contracts</h3></div><div className="flex-1 space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">{selectedClient.contracts?.map((doc, i) => (<div key={i} className="flex justify-between items-center text-sm p-3 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors group"><div className="flex items-center gap-3 min-w-0"><div className="bg-blue-500/10 text-blue-500 p-2 rounded-lg flex-shrink-0"><FileText size={16}/></div><div className="min-w-0"><div className="text-white font-medium truncate max-w-[150px]">{doc.name}</div><div className="text-zinc-600 text-xs">{doc.date}</div></div></div><a href={doc.url} download={doc.name} className="text-zinc-500 hover:text-white"><Download size={16}/></a></div>))}</div><div className="pt-4 border-t border-zinc-800"><label className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors"><UploadCloud size={18} className="mr-2"/> {contractUploading ? "Saving..." : "Upload (Max 1MB)"}<input type="file" className="hidden" onChange={handleUploadContract} disabled={contractUploading} /></label></div>{selectedClient.clientUploads?.length > 0 && (<div className="mt-4 pt-4 border-t border-zinc-800"><h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Client Files</h4><div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">{selectedClient.clientUploads.map((doc, i) => (<div key={i} className="flex justify-between items-center text-xs p-2 bg-zinc-800/50 rounded border border-zinc-700"><span className="truncate text-zinc-300">{doc.name}</span><a href={doc.url} download={doc.name} className="text-blue-400 hover:text-blue-300"><Download size={14}/></a></div>))}</div></div>)}</div>
              </div>

              {/* --- NEW CHAT SECTION --- */}
              <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 flex flex-col h-[500px]">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold flex items-center gap-2 text-blue-400"><MessageSquare size={18}/> Client Messages</h3>
                  </div>
                  <div ref={chatScrollRef} className="flex-1 space-y-4 mb-6 overflow-y-auto pr-2 custom-scrollbar p-4 bg-black/20 rounded-xl border border-zinc-800/50">
                      {(selectedClient.messages || []).map((msg, i) => (
                          <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'admin' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-300 rounded-bl-none'}`}>
                                  <p>{msg.text}</p>
                                  <p className="text-[10px] opacity-50 mt-1">{msg.time}</p>
                              </div>
                          </div>
                      ))}
                      {(!selectedClient.messages || selectedClient.messages.length === 0) && (
                          <div className="text-center text-zinc-500 text-sm mt-10">No messages yet. Start the conversation.</div>
                      )}
                  </div>
                  <form onSubmit={handleAdminSendMessage} className="flex gap-2">
                      <input 
                          type="text" 
                          placeholder="Type a message to client..." 
                          value={adminMessageInput} 
                          onChange={(e) => setAdminMessageInput(e.target.value)} 
                          className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-base md:text-sm text-white focus:border-blue-500 outline-none"
                      />
                      <Button variant="primary" type="submit" className="px-4"><Send size={18}/></Button>
                  </form>
              </div>
           </div>
        )}
        {!selectedClient && !isAddingNew && (<div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-6"><div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-inner"><Users size={48} className="opacity-50"/></div><div className="text-center"><h3 className="text-xl font-bold text-white mb-2">Select a Client</h3><p>Manage projects, invoices, and files.</p></div></div>)}
      </div>
    </div>
  );
}

function AdminUsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "clients"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleAdminRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    try { 
        await updateDoc(doc(db, "clients", userId), { 
            role: newRole,
            activity: arrayUnion({ action: `Role changed to ${newRole}`, date: new Date().toLocaleDateString(), status: "Completed" })
        }); 
    } catch (error) { alert("Error updating role: " + error.message); }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8"><h1 className="text-3xl font-bold mb-1">User Management</h1><p className="text-zinc-500">Manage user roles and permissions.</p></div>
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-12 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50"><div className="col-span-4">User / Email</div><div className="col-span-3">Project</div><div className="col-span-3">Current Role</div><div className="col-span-2 text-right">Actions</div></div>
          {loading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto"/></div> : users.map((user) => (
              <div key={user.id} className="grid grid-cols-12 p-4 border-b border-zinc-800 last:border-0 items-center hover:bg-zinc-800/20 transition-colors">
                <div className="col-span-4 min-w-0 pr-4"><div className="font-bold text-white truncate">{user.name || 'Unknown'}</div><div className="text-xs text-zinc-500 truncate">{user.email || 'No Email'}</div></div><div className="col-span-3 text-zinc-400 text-sm truncate">{user.project || 'N/A'}</div>
                <div className="col-span-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>{user.role || 'CLIENT'}</span></div>
                <div className="col-span-2 text-right"><button onClick={() => toggleAdminRole(user.id, user.role)} className={`text-xs px-3 py-1.5 rounded transition-colors ${user.role === 'admin' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-white text-black hover:bg-gray-200 font-bold'}`}>{user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}</button></div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminTasksView({ clients, onNavigateToTasks }) {
  const actualClients = clients.filter(c => c.role !== 'admin');
  const admins = clients.filter(c => c.role === 'admin');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '', dueDate: '', priority: 'medium' });
  const [filter, setFilter] = useState('all'); // all, pending, completed

  const selectedClient = actualClients.find(c => c.id === selectedClientId);

  // Get all tasks across all clients for overview
  const allTasks = actualClients.flatMap(c =>
    (c.tasks || []).map((t, idx) => ({ ...t, clientId: c.id, clientName: c.name, projectName: c.project, taskIndex: idx }))
  );

  const filteredTasks = allTasks.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const pendingCount = allTasks.filter(t => !t.completed).length;
  const completedCount = allTasks.filter(t => t.completed).length;

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !selectedClientId) return;

    const assignedAdmin = admins.find(a => a.id === newTask.assignedTo);
    const task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      assignedTo: newTask.assignedTo || null,
      assignedToName: assignedAdmin?.name || 'Unassigned',
      dueDate: newTask.dueDate || null,
      priority: newTask.priority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, "clients", selectedClientId), {
        tasks: arrayUnion(task),
        activity: arrayUnion({
          action: `Task created: ${task.title}${assignedAdmin ? ` (assigned to ${assignedAdmin.name})` : ''}`,
          date: new Date().toLocaleDateString(),
          status: "Pending"
        })
      });
      setNewTask({ title: '', assignedTo: '', dueDate: '', priority: 'medium' });
      setIsAddingTask(false);
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Failed to add task: " + err.message);
    }
  };

  const handleToggleComplete = async (clientId, taskIndex, currentTasks) => {
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], completed: !updatedTasks[taskIndex].completed };

    try {
      await updateDoc(doc(db, "clients", clientId), {
        tasks: updatedTasks,
        activity: arrayUnion({
          action: `Task ${updatedTasks[taskIndex].completed ? 'completed' : 'reopened'}: ${updatedTasks[taskIndex].title}`,
          date: new Date().toLocaleDateString(),
          status: updatedTasks[taskIndex].completed ? "Completed" : "Pending"
        })
      });
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleDeleteTask = async (clientId, taskIndex, currentTasks) => {
    if (!confirm("Delete this task?")) return;
    const taskToDelete = currentTasks[taskIndex];
    const updatedTasks = currentTasks.filter((_, i) => i !== taskIndex);

    try {
      await updateDoc(doc(db, "clients", clientId), {
        tasks: updatedTasks,
        activity: arrayUnion({
          action: `Task deleted: ${taskToDelete.title}`,
          date: new Date().toLocaleDateString(),
          status: "Completed"
        })
      });
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleUpdateAssignment = async (clientId, taskIndex, currentTasks, newAssigneeId) => {
    const assignedAdmin = admins.find(a => a.id === newAssigneeId);
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      assignedTo: newAssigneeId || null,
      assignedToName: assignedAdmin?.name || 'Unassigned'
    };

    try {
      await updateDoc(doc(db, "clients", clientId), {
        tasks: updatedTasks,
        activity: arrayUnion({
          action: `Task reassigned: ${updatedTasks[taskIndex].title} to ${assignedAdmin?.name || 'Unassigned'}`,
          date: new Date().toLocaleDateString(),
          status: "Completed"
        })
      });
    } catch (err) {
      console.error("Error updating assignment:", err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Project Tasks</h1>
          <p className="text-zinc-500">Assign and manage tasks for each project. Only admins can be assigned.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-400 font-bold">{pendingCount}</span>
            <span className="text-zinc-500">Pending</span>
            <span className="text-zinc-700">|</span>
            <span className="text-green-400 font-bold">{completedCount}</span>
            <span className="text-zinc-500">Completed</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Project Selector Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 lg:h-full flex-shrink-0">
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'primary' : 'secondary'} className="flex-1 py-2 text-xs" onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'pending' ? 'primary' : 'secondary'} className="flex-1 py-2 text-xs" onClick={() => setFilter('pending')}>Pending</Button>
            <Button variant={filter === 'completed' ? 'primary' : 'secondary'} className="flex-1 py-2 text-xs" onClick={() => setFilter('completed')}>Done</Button>
          </div>
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden overflow-y-auto custom-scrollbar">
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-sm font-bold text-zinc-400">SELECT PROJECT</h3>
            </div>
            {actualClients.map(client => {
              const clientTasks = client.tasks || [];
              const clientPending = clientTasks.filter(t => !t.completed).length;
              return (
                <div
                  key={client.id}
                  onClick={() => { setSelectedClientId(client.id); setIsAddingTask(false); }}
                  className={`p-4 border-b border-zinc-800 cursor-pointer transition-all duration-200 group ${selectedClientId === client.id ? 'bg-blue-900/10 border-l-4 border-l-blue-500 pl-3' : 'hover:bg-zinc-800/40 border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold truncate ${selectedClientId === client.id ? 'text-white' : 'text-zinc-300'}`}>{client.name}</span>
                    {clientPending > 0 && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{clientPending}</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{client.project}</p>
                </div>
              );
            })}
            {actualClients.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-sm">No projects available</div>
            )}
          </div>
        </div>

        {/* Main Task Panel */}
        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 overflow-y-auto custom-scrollbar">
          {selectedClient ? (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                  <p className="text-zinc-500 text-sm">{selectedClient.project} • {selectedClient.phase}</p>
                </div>
                <Button variant="accent" onClick={() => setIsAddingTask(true)} className="gap-2">
                  <Plus size={16} /> Add Task
                </Button>
              </div>

              {/* Add Task Form */}
              {isAddingTask && (
                <form onSubmit={handleAddTask} className="bg-black/40 border border-zinc-700 rounded-xl p-6 mb-6 animate-fade-in">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <ClipboardList size={18} className="text-blue-400" /> New Task
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 mb-1 block">Task Title *</label>
                      <input
                        type="text"
                        required
                        value={newTask.title}
                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="e.g. Complete homepage wireframes"
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block flex items-center gap-1">
                        <UserCheck size={12} /> Assign to Admin
                      </label>
                      <select
                        value={newTask.assignedTo}
                        onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                      >
                        <option value="">Unassigned</option>
                        {admins.map(admin => (
                          <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block flex items-center gap-1">
                        <CalendarDays size={12} /> Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" onClick={() => setIsAddingTask(false)}>Cancel</Button>
                    <Button type="submit" variant="success">Create Task</Button>
                  </div>
                </form>
              )}

              {/* Task List */}
              <div className="space-y-3">
                {(selectedClient.tasks || []).length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <ListTodo size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No tasks for this project yet.</p>
                    <p className="text-sm">Click "Add Task" to create one.</p>
                  </div>
                ) : (
                  (selectedClient.tasks || [])
                    .filter(t => {
                      if (filter === 'pending') return !t.completed;
                      if (filter === 'completed') return t.completed;
                      return true;
                    })
                    .map((task, idx) => {
                      // Find the original index for operations
                      const originalIndex = (selectedClient.tasks || []).findIndex(t => t.id === task.id);
                      return (
                        <div
                          key={task.id || idx}
                          className={`bg-black/40 border rounded-xl p-4 transition-all ${task.completed ? 'border-zinc-800 opacity-60' : 'border-zinc-700 hover:border-zinc-600'}`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggleComplete(selectedClient.id, originalIndex, selectedClient.tasks)}
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-green-500'}`}
                            >
                              {task.completed && <Check size={12} className="text-white" />}
                            </button>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`font-medium ${task.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                                  {task.title}
                                </span>
                                <span className={`text-[10px] uppercase px-2 py-0.5 rounded border font-bold ${getPriorityColor(task.priority)}`}>
                                  {task.priority || 'medium'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                {/* Assignee Dropdown */}
                                <div className="flex items-center gap-1">
                                  <UserCheck size={12} className={task.assignedTo ? 'text-blue-400' : 'text-zinc-500'} />
                                  <select
                                    value={task.assignedTo || ''}
                                    onChange={e => handleUpdateAssignment(selectedClient.id, originalIndex, selectedClient.tasks, e.target.value)}
                                    className={`bg-transparent cursor-pointer outline-none text-xs font-medium ${task.assignedTo ? 'text-blue-400 hover:text-blue-300' : 'text-zinc-500 hover:text-white'}`}
                                  >
                                    <option value="">Unassigned</option>
                                    {admins.map(admin => (
                                      <option key={admin.id} value={admin.id}>{admin.name}</option>
                                    ))}
                                  </select>
                                </div>

                                {task.dueDate && (
                                  <span className="flex items-center gap-1 text-zinc-500">
                                    <CalendarDays size={12} />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteTask(selectedClient.id, originalIndex, selectedClient.tasks)}
                              className="text-zinc-600 hover:text-red-500 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                <ClipboardList size={40} className="opacity-50" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Select a Project</h3>
                <p>Choose a project to view and manage its tasks.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminFinancialsView({ clients }) {
  const actualClients = clients.filter(c => c.role !== 'admin');
  const parseAmount = (amt) => {
      if (typeof amt === 'number') return amt;
      if (typeof amt === 'string') return parseFloat(amt.replace(/[^0-9.-]+/g, "")) || 0;
      return 0;
  };
  const totalRevenue = actualClients.reduce((sum, c) => sum + (c.invoices?.filter(i => i.status === 'Paid').reduce((s, i) => s + parseAmount(i.amount), 0) || 0), 0);
  const totalOutstanding = actualClients.reduce((sum, c) => sum + (c.invoices?.filter(i => i.status !== 'Paid').reduce((s, i) => s + parseAmount(i.amount), 0) || 0), 0);
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const allTransactions = actualClients.flatMap(client => (client.invoices || []).map(inv => ({ ...inv, clientName: client.name })));
  return (
  <div className="animate-fade-in"><div className="mb-8"><h1 className="text-3xl font-bold mb-1">Financials</h1><p className="text-zinc-500">Revenue tracking based on active client deals.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><Card><h3 className="text-zinc-400 text-sm mb-1">Total Revenue</h3><p className="text-3xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p></Card><Card><h3 className="text-zinc-400 text-sm mb-1">Outstanding</h3><p className="text-3xl font-bold text-yellow-500">{formatCurrency(totalOutstanding)}</p></Card><Card><h3 className="text-zinc-400 text-sm mb-1">Active Clients</h3><p className="text-3xl font-bold text-blue-500">{actualClients.length}</p></Card></div><h3 className="text-xl font-bold mb-6">All Transactions</h3><div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto"><div className="min-w-[600px]"><div className="grid grid-cols-4 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50"><div>Client</div><div>Date</div><div>Invoice ID</div><div className="text-right">Amount</div></div>{allTransactions.map((t, i) => (<div key={i} className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors"><div className="text-white font-medium truncate">{t.clientName || 'Unknown'}</div><div className="text-zinc-500">{t.date}</div><div className="text-zinc-500 font-mono text-xs pt-1">{t.id}</div><div className={`text-right font-mono ${t.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{t.amount}</div></div>))}{allTransactions.length === 0 && <div className="p-4 text-center text-zinc-500">No transactions recorded.</div>}</div></div></div>
  );
}

function AdminPortal({ onLogout, clients, setClients, adminSettings, setAdminSettings }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPhoneDemo, setShowPhoneDemo] = useState(false);
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects / Pipeline', icon: Briefcase },
    { id: 'tasks', label: 'Project Tasks', icon: ClipboardList },
    { id: 'clients', label: 'Clients List', icon: Users },
    { id: 'financials', label: 'Financials', icon: CreditCard },
    { id: 'data', label: 'Data & AI Models', icon: Brain },
    { id: 'reports', label: 'Reporting Tools', icon: FileSpreadsheet },
    { id: 'logs', label: 'Activity Logs', icon: History },
    { id: 'users', label: 'User Roles', icon: Shield },
    { id: 'settings', label: 'Configuration', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans border-l-0 lg:border-l-4 lg:border-red-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <div className="font-bold text-red-500">ADMIN PANEL</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full backdrop-blur-md lg:backdrop-blur-none bg-black/90 lg:bg-transparent`}>
        <h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">ADMIN<span className="text-white">_PANEL</span></h2>
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${activeTab === item.id ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'}`}
            >
              <item.icon size={18} /> {item.label}
            </div>
          ))}
        </nav>
        <button
          onClick={() => setShowPhoneDemo(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-purple-900/20 text-purple-400 hover:bg-purple-900/30 border border-purple-900/50 transition-all duration-200 text-sm font-medium mb-4"
        >
          <Phone size={18} /> Try AI Demo
        </button>
        <button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors px-4 py-2 border-t border-zinc-800 pt-4">
          Log Out <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'dashboard' && <AdminDashboardView clients={clients} onNavigateToTasks={() => setActiveTab('tasks')} />}
        {activeTab === 'projects' && <AdminPipelineView clients={clients} />}
        {activeTab === 'tasks' && <AdminTasksView clients={clients} />}
        {activeTab === 'clients' && <AdminClientsManager clients={clients} setClients={setClients} />}
        {activeTab === 'financials' && <AdminFinancialsView clients={clients} />}
        {activeTab === 'data' && <AdminDataAIView />}
        {activeTab === 'reports' && <AdminReportsView clients={clients} />}
        {activeTab === 'logs' && <AdminActivityLogsView clients={clients} />}
        {activeTab === 'users' && <AdminUsersManager />}
        {activeTab === 'settings' && <AdminGlobalSettingsView settings={adminSettings} onUpdateSettings={setAdminSettings} />}
      </div>

      <PhoneCallDemo isOpen={showPhoneDemo} onClose={() => setShowPhoneDemo(false)} />
    </div>
  );
}

function ClientPortal({ onLogout, clientData, onUpdateClient, onDeleteAccount }) {
  const [activeTab, setActiveTab] = useState('dashboard'); const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuItems = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'projects', label: 'Projects', icon: Briefcase }, { id: 'documents', label: 'Documents', icon: FolderOpen }, { id: 'messages', label: 'Messages', icon: MessageSquare }, { id: 'invoices', label: 'Invoices', icon: CreditCard }, { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen }, { id: 'settings', label: 'Settings', icon: Settings }];
  const [showOnboarding, setShowOnboarding] = useState(clientData?.project === "New Project");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  useEffect(() => { if (clientData?.project === "New Project" && !hasSubmitted) { setShowOnboarding(true); } else if (clientData?.project !== "New Project") { setShowOnboarding(false); } }, [clientData?.project, hasSubmitted]);
  const handleProjectSubmit = async (newProjectName) => { setHasSubmitted(true); setShowOnboarding(false); await onUpdateClient({ ...clientData, project: newProjectName }); };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col lg:flex-row relative">
      <ProjectOnboardingModal isOpen={showOnboarding} onSubmit={handleProjectSubmit} />
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900"><div className="font-bold">WEBFRONT_OS</div><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">{mobileMenuOpen ? <X /> : <Menu />}</button></div>
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full backdrop-blur-md lg:backdrop-blur-none bg-black/90 lg:bg-transparent`}><h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">WEBFRONT<span className="text-blue-500">_OS</span></h2><nav className="space-y-1 flex-1">{menuItems.map((item) => (<div key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${activeTab === item.id ? 'bg-zinc-800 text-white shadow-lg border-l-2 border-blue-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30 border-l-2 border-transparent'}`}><item.icon size={18} className={activeTab === item.id ? 'text-blue-400' : ''} /> <span className={activeTab === item.id ? 'font-medium' : ''}>{item.label}</span></div>))}</nav><button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-4 border-t border-zinc-800">Log Out <ArrowRight size={14} /></button></div>
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'dashboard' && <ClientDashboardView data={clientData} />}
        {activeTab === 'projects' && <ClientProjectsView data={clientData} />}
        {activeTab === 'documents' && <ClientDocumentsView data={clientData} />}
        {activeTab === 'messages' && <ClientMessagesView data={clientData} />}
        {activeTab === 'invoices' && <ClientInvoicesView data={clientData} />}
        {activeTab === 'knowledge' && <ClientKnowledgeBaseView />}
        {activeTab === 'settings' && <SettingsView data={clientData} onUpdateClient={onUpdateClient} onDeleteAccount={onDeleteAccount} />}
      </div>
    </div>
  );
}

// --- APP CONTROLLER ---
export default function App() {
  const [view, setView] = useState('landing');
  const [userRole, setUserRole] = useState('client');
  const [clients, setClients] = useState([]);
  const [currentClientData, setCurrentClientData] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  const MASTER_ADMIN_EMAIL = import.meta.env.VITE_MASTER_ADMIN_EMAIL?.toLowerCase() || '';
  const [adminSettings, setAdminSettings] = useState({ name: "Admin User", email: MASTER_ADMIN_EMAIL, maintenanceMode: false });
  const isSigningUp = useRef(false);
  const [tempUserForReset, setTempUserForReset] = useState(null);
  const [earlyAccessApproved, setEarlyAccessApproved] = useState(false);

  // Check if we're before January 2, 2026
  const LAUNCH_DATE = new Date('2026-01-02T00:00:00');
  const isBeforeLaunch = new Date() < LAUNCH_DATE;

  useEffect(() => {
    const safetyTimer = setTimeout(() => { if (appLoading) { console.warn("Firebase auth timed out - forcing app load."); setAppLoading(false); } }, 3000);
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimer);
      if (isSigningUp.current) return;
      if (user) {
        const isMaster = user.email.toLowerCase() === MASTER_ADMIN_EMAIL;
        try {
          const docRef = doc(db, "clients", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = isMaster ? 'admin' : (data.role || 'client');
            setUserRole(role);
            setCurrentClientData({ id: user.uid, ...data });

            // Check if password reset required
            if (data.requiresPasswordReset && !isMaster) {
              setTempUserForReset(user);
              setView('reset-password');
            } else if (role === 'admin') {
              setView('admin');
            } else {
              setView('portal');
            }
          } else { setView('landing'); }
        } catch (err) { 
            console.error("Error fetching user data on auth change:", err); 
            if (err.message && err.message.includes("INTERNAL ASSERTION FAILED")) { alert("Session Error: Please clear your browser cache and refresh."); setView('landing'); }
        }
      } else { setView('landing'); setCurrentClientData(null); }
      setAppLoading(false);
    });
    return () => { unsubscribeAuth(); clearTimeout(safetyTimer); };
  }, []);

  useEffect(() => {
    if (appLoading) return;
    if (!currentClientData && userRole !== 'admin') return;
    let unsubscribe;
    if (userRole === 'admin') {
       const q = collection(db, "clients");
       unsubscribe = onSnapshot(q, (snapshot) => { setClients(snapshot.docs.map(d => ({id: d.id, ...d.data()}))); }, (err) => console.log("Admin listen error", err));
    } else if (userRole === 'client' && currentClientData?.id) {
       const docRef = doc(db, "clients", currentClientData.id);
       unsubscribe = onSnapshot(docRef, (docSnap) => { if (docSnap.exists()) { setCurrentClientData({ id: docSnap.id, ...docSnap.data() }); } }, (err) => console.log("Client listen error", err));
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [userRole, currentClientData?.id, appLoading]);

  const handleLogin = (role, clientData) => { setUserRole(role); if (role === 'admin') { setView('admin'); } else { setCurrentClientData(clientData); setView('portal'); } };
  const handleClientUpdate = async (updatedClient) => { try { await updateDoc(doc(db, 'clients', updatedClient.id), { name: updatedClient.name, notifications: updatedClient.notifications, project: updatedClient.project }); } catch(e) { console.error("Update failed", e); } };
  const handleClientDelete = async (id) => { if (confirm("Are you sure you want to delete your account? This cannot be undone.")) { try { await deleteDoc(doc(db, 'clients', id)); await signOut(auth); setView('landing'); } catch(e) { alert(e.message); } } };
  const handleAuthSubmit = async (isSignUp, email, password, name) => {
    const isMasterAdmin = email.toLowerCase() === MASTER_ADMIN_EMAIL;
    if (adminSettings.maintenanceMode && isSignUp && !isMasterAdmin) return { error: "New signups are disabled during maintenance." };
    try {
        let user; let uid;
        if (isSignUp) {
            isSigningUp.current = true; 
            const userCredential = await createUserWithEmailAndPassword(auth, email, password); user = userCredential.user; uid = user.uid;
            const role = isMasterAdmin ? 'admin' : 'client';
            const clientData = { id: uid, name: name || (isMasterAdmin ? "Master Admin" : "New User"), email: email, role: role, project: isMasterAdmin ? "WebFront AI System" : "New Project", phase: "Discovery", progress: 0, milestone: "Onboarding", dueDate: "TBD", revenue: 0, status: "Active", activity: [{ action: "Account Created", date: new Date().toLocaleDateString(), status: "Completed" }], invoices: [], contracts: [], clientUploads: [], notifications: { email: true, push: false } };
            await setDoc(doc(db, "clients", uid), clientData); handleLogin(role, clientData); isSigningUp.current = false; 
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, email, password); user = userCredential.user; uid = user.uid;
            const clientDocSnap = await getDoc(doc(db, "clients", uid));
            if (clientDocSnap.exists()) { const userData = clientDocSnap.data(); const userRole = isMasterAdmin ? 'admin' : (userData.role || 'client'); handleLogin(userRole, userData); } 
            else { if (isMasterAdmin) { const adminData = { id: uid, name: "Master Admin", email: email, role: 'admin', project: "System Admin", phase: "Admin", progress: 100, milestone: "N/A", dueDate: "N/A", revenue: 0, status: "Active", activity: [], invoices: [], contracts: [], clientUploads: [] }; await setDoc(doc(db, "clients", uid), adminData); handleLogin('admin', adminData); } else { await signOut(auth); return { error: "User data not found. Please contact support." }; } }
        }
        return { error: null };
    } catch (firebaseError) {
        isSigningUp.current = false; console.error("Auth Error:", firebaseError);
        if (firebaseError.code === 'auth/email-already-in-use') return { error: "Email already in use." };
        if (firebaseError.code === 'auth/invalid-credential') return { error: "Invalid email or password." };
        return { error: firebaseError.message };
    }
  };

  if (appLoading) { return (<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white w-10 h-10" /></div>); }

  const handlePasswordResetComplete = () => {
    // After password reset, redirect to appropriate dashboard
    if (userRole === 'admin') {
      setView('admin');
    } else {
      setView('portal');
    }
  };

  const handleEarlyAccessLogin = () => {
    setEarlyAccessApproved(true);
  };

  // Show early access gate if before launch date and not approved
  if (isBeforeLaunch && !earlyAccessApproved) {
    return <EarlyAccessGate onAdminLogin={handleEarlyAccessLogin} />;
  }

  return (
    <>
      {view === 'landing' && <LandingPage onLogin={() => setView('auth')} />}
      {view === 'auth' && <AuthScreen onAuthSubmit={handleAuthSubmit} onBack={() => setView('landing')} maintenanceMode={adminSettings.maintenanceMode} />}
      {view === 'reset-password' && tempUserForReset && <PasswordResetScreen user={tempUserForReset} userData={currentClientData} onResetComplete={handlePasswordResetComplete} />}
      {view === 'portal' && currentClientData && <ClientPortal onLogout={() => signOut(auth)} clientData={currentClientData} onUpdateClient={handleClientUpdate} onDeleteAccount={handleClientDelete} />}
      {view === 'admin' && <AdminPortal onLogout={() => signOut(auth)} clients={clients} setClients={setClients} adminSettings={adminSettings} setAdminSettings={setAdminSettings} />}
    </>
  );
}