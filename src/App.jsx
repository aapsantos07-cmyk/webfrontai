import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Code, Cpu, ArrowRight, Check, Menu, X, ChevronDown, Lock, 
  LayoutDashboard, FileText, CreditCard, Settings, Send, User, Bot, Palette, 
  Brain, Headphones, TrendingUp, LogIn, Download, Bell, Shield, Mail, Sparkles, 
  Loader2, Users, BarChart3, Briefcase, Edit3, Plus, Save, Trash2, Search, 
  DollarSign, Activity, UploadCloud, XCircle, CheckCircle2, LogOut, AlertTriangle, 
  Power, ListTodo, FolderOpen, HelpCircle, BookOpen, Clock
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';

import { 
  doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs, addDoc, deleteDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

// --- LOCAL FIREBASE CONFIG ---
import { auth, db, storage } from './firebase'; 
// --------------------------------

const apiKey = "AIzaSyBB3MXjcC5KcRja7Kl91joSJOUwGCk0q5Q"; // injected at runtime

// --- GLOBAL LOCK (Prevents Race Conditions across re-renders) ---
let isGlobalSigningUp = false;

// --- Helper: Convert File to Base64 ---
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// --- Helper: Intersection Observer Hook for Animations ---
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

// --- API Logic ---
const callGemini = async (userQuery, systemPrompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       const errorData = await response.json();
       console.error("Gemini API Error:", errorData);
       throw new Error(errorData.error?.message || "API Request Failed");
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error("CallGemini Exception:", error);
    return null; 
  }
};

// --- Helper Components ---
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

// --- NEW COMPONENT: Project Onboarding Modal ---
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
            <input 
              autoFocus
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Acme Corp Redesign"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-blue-500 focus:bg-zinc-900 transition-all"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={!projectName.trim() || loading}>
            {loading ? <><Loader2 className="animate-spin mr-2"/> Setting up...</> : <>Launch Project <ArrowRight size={20}/></>}
          </Button>
        </form>
      </div>
    </div>
  );
}

// --- AI Chat Widget ---
function AIChatDemo() {
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hello. I am WEBFRONT_AI. How can I assist your agency today?" }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
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

    const systemPrompt = `You are WEBFRONT_AI, the on-site AI Receptionist for **WebFront AI**. 
    Your only job is to talk to visitors about WebFront AI, our services, pricing, and process, and help them decide to book a strategy call.
    IMPORTANT RULES:
    1. **Keep your answers SHORT.** Maximum 2-3 sentences.
    2. Use **bold** syntax.`;

    const response = await callGemini(userMsg, systemPrompt);
    setMessages(prev => [...prev, { role: 'ai', text: response || "I am currently experiencing heavy traffic. Please try again." }]);
    setIsTyping(false);
  };

  return (
    <div className="w-full max-w-md bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[400px] md:h-[500px] transition-all duration-500 hover:shadow-blue-900/20 hover:border-zinc-700">
      <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-[pulse_2s_infinite]"></div><span className="font-mono text-sm text-zinc-400">WEBFRONT_AI</span></div>
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
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-zinc-800 p-3 rounded-lg rounded-bl-none flex gap-1 items-center border border-zinc-700">
              <Loader2 size={14} className="animate-spin text-zinc-500" />
              <span className="text-xs text-zinc-500 ml-2">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
          placeholder="Ask about pricing, services..."
          className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
        />
        <button onClick={handleSend} className="bg-white text-black p-2 rounded-lg hover:bg-gray-200 transition-colors transform active:scale-95">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// --- Auth Screen ---
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Acme Corp" required={isSignUp} />
              </div>
            )}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="name@company.com" required />
            </div>
            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-zinc-400 font-medium">Password</label>
                  {!isSignUp && (<button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }} className="text-xs text-blue-400 hover:text-blue-300">Forgot Password?</button>)}
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" required />
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

// --- CLIENT PORTAL VIEWS ---

function ClientDashboardView({ data }) {
  const totalOpenBalance = data.invoices?.reduce((acc, inv) => inv.status !== 'Paid' ? acc + (parseFloat(inv.amount.replace(/[^0-9.-]+/g, "")) || 0) : acc, 0) || 0;
  const formattedBalance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalOpenBalance);
  const activeTasks = data.tasks?.filter(t => !t.completed)?.length || 0;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">Welcome back, {data.name}</h1>
            <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded-full font-bold border ${data.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {data.status || 'Active'}
            </span>
        </div>
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/40">{data.name?.charAt(0) || 'U'}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <h3 className="text-zinc-400 text-sm mb-1">Project Status</h3>
          <p className="text-xl font-bold truncate">{data.phase}</p>
          <p className="text-xs text-blue-400 mt-2">{data.progress}% Complete</p>
        </Card>
        <Card>
            <h3 className="text-zinc-400 text-sm mb-1">Next Milestone</h3>
            <p className="text-xl font-bold truncate">{data.milestone}</p>
            <p className="text-zinc-500 text-xs mt-2">Due: {data.dueDate}</p>
        </Card>
        <Card>
            <h3 className="text-zinc-400 text-sm mb-1">Pending Tasks</h3>
            <p className="text-xl font-bold">{activeTasks}</p>
            <p className="text-zinc-500 text-xs mt-2">Action Items</p>
        </Card>
        <Card>
            <h3 className="text-zinc-400 text-sm mb-1">Open Balance</h3>
            <p className="text-xl font-bold">{formattedBalance}</p>
            <p className={`text-xs mt-2 ${totalOpenBalance > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{totalOpenBalance > 0 ? 'Payment Due' : 'Paid'}</p>
        </Card>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
          {data.activity && data.activity.length > 0 ? data.activity.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div><span className="truncate max-w-[200px] sm:max-w-md">{item.action}</span></div><span className="text-zinc-500 text-sm whitespace-nowrap ml-4">{item.date}</span>
              </div>
          )) : <div className="p-4 text-zinc-500 text-center">No recent activity</div>}
        </div>
      </div>
    </div>
  );
}

function ClientProjectsView({ data }) {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="mb-4">
                <h1 className="text-3xl font-bold mb-1">Active Project</h1>
                <p className="text-zinc-500">{data.project}</p>
            </div>
            
            <Card className="p-8">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <div className="text-sm text-blue-400 font-bold uppercase tracking-widest mb-1">Current Phase</div>
                        <h2 className="text-4xl font-bold text-white">{data.phase}</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{data.progress}%</div>
                    </div>
                </div>
                <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden mb-8">
                    <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${data.progress}%` }}></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-800 pt-6">
                    <div>
                        <h4 className="text-zinc-500 text-sm mb-1">Next Milestone</h4>
                        <p className="text-white font-medium">{data.milestone}</p>
                    </div>
                    <div>
                        <h4 className="text-zinc-500 text-sm mb-1">Target Date</h4>
                        <p className="text-white font-medium">{data.dueDate}</p>
                    </div>
                    <div>
                        <h4 className="text-zinc-500 text-sm mb-1">Status</h4>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${data.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {data.status === 'Completed' ? <CheckCircle2 size={14}/> : <Activity size={14}/>}
                            {data.status || 'Active'}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Simple Roadmap Visualization */}
            <div>
                <h3 className="text-xl font-bold mb-4">Project Roadmap</h3>
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-6">
                    {['Discovery', 'Design', 'Development', 'Testing', 'Live'].map((phase, i) => {
                        const isCompleted = data.progress > (i + 1) * 20;
                        const isCurrent = data.phase === phase;
                        return (
                            <div key={i} className={`flex items-center gap-4 ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-500 border-green-500 text-black' : isCurrent ? 'border-blue-500 text-blue-500' : 'border-zinc-700 text-zinc-700'}`}>
                                    {isCompleted ? <Check size={16}/> : i + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold ${isCurrent ? 'text-blue-400' : 'text-white'}`}>{phase}</h4>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

function ClientTasksView({ data }) {
    const tasks = data.tasks || []; // Placeholder if tasks don't exist in DB yet

    return (
        <div className="animate-fade-in space-y-6">
             <div className="mb-4">
                <h1 className="text-3xl font-bold mb-1">Your Tasks</h1>
                <p className="text-zinc-500">Action items required to move the project forward.</p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                {tasks.length > 0 ? (
                    tasks.map((task, i) => (
                        <div key={i} className="flex items-center p-5 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 transition-colors">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-4 ${task.completed ? 'bg-green-500 border-green-500 text-black' : 'border-zinc-600'}`}>
                                {task.completed && <Check size={14}/>}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold ${task.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>{task.title}</h4>
                                <p className="text-xs text-zinc-500">Due: {task.dueDate}</p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full border ${task.completed ? 'bg-green-900/20 text-green-500 border-green-900/50' : 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50'}`}>
                                {task.completed ? 'Done' : 'Pending'}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center flex flex-col items-center text-zinc-500">
                        <ListTodo size={48} className="mb-4 opacity-20"/>
                        <p>No tasks assigned yet.</p>
                        <p className="text-sm mt-2">Check back later or contact admin.</p>
                    </div>
                )}
            </div>
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
      await updateDoc(doc(db, "clients", data.id), { clientUploads: arrayUnion(newDoc) });
      alert("File uploaded successfully!");
    } catch (error) { alert("Upload failed: " + error.message); } finally { setUploading(false); }
  };

  return (
  <div className="animate-fade-in space-y-8">
    <div><h1 className="text-3xl font-bold mb-1">Documents & Files</h1><p className="text-zinc-500">Securely view contracts and share files.</p></div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400"><FileText size={20}/> Official Documents</h3>
            <div className="space-y-3">
                {data.contracts && data.contracts.length > 0 ? data.contracts.map((doc, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-500"><FileText size={20} /></div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-white truncate text-sm">{doc.name}</h3>
                            <p className="text-xs text-zinc-500">{doc.date} • {doc.size}</p>
                        </div>
                    </div>
                    <a href={doc.url} download={doc.name} className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded-lg"><Download size={18} /></a>
                </div>
                )) : <div className="p-6 text-center text-zinc-500 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed text-sm">No documents shared yet.</div>}
            </div>
        </div>

        <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400"><UploadCloud size={20}/> Your Uploads</h3>
            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 p-6 mb-4 hover:border-zinc-600 transition-colors">
                <label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                        {uploading ? <Loader2 className="animate-spin text-blue-500 mb-2"/> : <UploadCloud className="w-8 h-8 text-zinc-500 mb-2" />}
                        <p className="text-sm text-zinc-500">{uploading ? "Uploading..." : "Click to upload file (Max 1MB)"}</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleClientUpload} disabled={uploading} />
                </label>
            </div>
            <div className="space-y-3">
                {data.clientUploads && data.clientUploads.length > 0 ? data.clientUploads.map((doc, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex-shrink-0 flex items-center justify-center"><Check size={18} /></div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-white truncate text-sm">{doc.name}</h3>
                            <p className="text-xs text-zinc-500">{doc.date} • {doc.size}</p>
                        </div>
                    </div>
                    <a href={doc.url} download={doc.name} className="text-zinc-500 hover:text-white p-2"><Download size={18}/></a>
                </div>
                )) : null}
            </div>
        </div>
    </div>
  </div>
  );
}

function ClientMessagesView({ data }) {
    const [messageInput, setMessageInput] = useState("");
    
    // Mocking messages since DB structure might not be fully ready
    // In production, these would come from `data.messages`
    const messages = data.messages || [
        { sender: 'admin', text: 'Welcome to your portal! Let us know if you have questions.', time: 'System • Just now' }
    ];

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        
        try {
            await updateDoc(doc(db, "clients", data.id), {
                messages: arrayUnion({
                    sender: 'client',
                    text: messageInput,
                    time: new Date().toLocaleString()
                })
            });
            setMessageInput("");
        } catch (err) {
            console.error("Message failed", err);
        }
    };

    return (
        <div className="animate-fade-in h-full flex flex-col">
            <div className="mb-4">
                <h1 className="text-3xl font-bold mb-1">Messages</h1>
                <p className="text-zinc-500">Direct line to your project manager.</p>
            </div>
            
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-[500px]">
                <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'client' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'}`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-2 ${msg.sender === 'client' ? 'text-blue-200' : 'text-zinc-500'}`}>{msg.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                    <input 
                        className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button type="submit" disabled={!messageInput.trim()} className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 disabled:opacity-50">
                        <Send size={20}/>
                    </button>
                </form>
            </div>
        </div>
    );
}

function ClientInvoicesView({ data }) {
  return (
  <div className="animate-fade-in">
    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"><div><h1 className="text-3xl font-bold mb-1">Invoices</h1><p className="text-zinc-500">View payment history and upcoming charges.</p></div><Button variant="secondary" className="px-4 py-2 text-xs w-full sm:w-auto">Download All CSV</Button></div>
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="grid grid-cols-4 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50"><div>Description</div><div>Date</div><div className="text-right">Amount</div></div>
        {data.invoices && data.invoices.length > 0 ? data.invoices.map((inv, i) => (
            <div key={i} className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors items-center">
              <div className="col-span-2 min-w-0"><div className="font-bold truncate pr-4">{inv.desc}</div><div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">{inv.id} <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${inv.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{inv.status}</span></div></div>
              <div className="text-zinc-400 text-sm">{inv.date}</div><div className="text-right font-mono">{inv.amount}</div>
            </div>
        )) : <div className="p-12 text-center text-zinc-500">No invoices found.</div>}
      </div>
    </div>
  </div>
  );
}

function ClientKnowledgeBaseView() {
    const faqs = [
        { q: "How do I update my project requirements?", a: "You can send a message directly to your project manager via the 'Messages' tab or upload a new requirement document in 'Documents'." },
        { q: "When are invoices generated?", a: "Invoices are generated typically at the start of each project phase or milestone completion." },
        { q: "How do I interpret the 'AI Assistant'?", a: "The AI Assistant has context on your project status and can answer general questions about timelines and deliverables." }
    ];

    return (
        <div className="animate-fade-in max-w-3xl">
             <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1">Knowledge Base</h1>
                <p className="text-zinc-500">Frequently asked questions and guides.</p>
            </div>
            <div className="space-y-4">
                {faqs.map((item, i) => (
                    <div key={i} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl">
                        <h3 className="font-bold text-white mb-2 flex items-start gap-3">
                            <HelpCircle size={20} className="text-blue-500 mt-0.5 flex-shrink-0"/> 
                            {item.q}
                        </h3>
                        <p className="text-zinc-400 text-sm pl-8 leading-relaxed">{item.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ClientPortal({ onLogout, clientData, onUpdateClient, onDeleteAccount }) {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- UPDATED NAVIGATION MENU ---
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'invoices', label: 'Invoices', icon: CreditCard },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // --- NEW LOGIC: Show Onboarding Modal if Project is "New Project" ---
  const [showOnboarding, setShowOnboarding] = useState(clientData?.project === "New Project");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (clientData?.project === "New Project" && !hasSubmitted) {
        setShowOnboarding(true);
    } else if (clientData?.project !== "New Project") {
        setShowOnboarding(false);
    }
  }, [clientData?.project, hasSubmitted]);

  const handleProjectSubmit = async (newProjectName) => {
    setHasSubmitted(true); 
    setShowOnboarding(false); 
    await onUpdateClient({ ...clientData, project: newProjectName });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col lg:flex-row relative">
      
      <ProjectOnboardingModal isOpen={showOnboarding} onSubmit={handleProjectSubmit} />

      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900"><div className="font-bold">WEBFRONT_OS</div><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">{mobileMenuOpen ? <X /> : <Menu />}</button></div>
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full backdrop-blur-md lg:backdrop-blur-none bg-black/90 lg:bg-transparent`}><h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">WEBFRONT<span className="text-blue-500">_OS</span></h2><nav className="space-y-1 flex-1">{menuItems.map((item) => (<div key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${activeTab === item.id ? 'bg-zinc-800 text-white shadow-lg border-l-2 border-blue-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30 border-l-2 border-transparent'}`}><item.icon size={18} className={activeTab === item.id ? 'text-blue-400' : ''} /> <span className={activeTab === item.id ? 'font-medium' : ''}>{item.label}</span></div>))}</nav><button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-4 border-t border-zinc-800">Log Out <ArrowRight size={14} /></button></div>
      
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'dashboard' && <ClientDashboardView data={clientData} />}
        {activeTab === 'projects' && <ClientProjectsView data={clientData} />}
        {activeTab === 'tasks' && <ClientTasksView data={clientData} />}
        {activeTab === 'documents' && <ClientDocumentsView data={clientData} />}
        {activeTab === 'messages' && <ClientMessagesView data={clientData} />}
        {activeTab === 'invoices' && <ClientInvoicesView data={clientData} />}
        {activeTab === 'knowledge' && <ClientKnowledgeBaseView />}
        {activeTab === 'settings' && <SettingsView data={clientData} onUpdateClient={onUpdateClient} onDeleteAccount={onDeleteAccount} />}
      </div>
    </div>
  );
}

// --- ADMIN PORTAL VIEWS ---

function AdminClientsManager({ clients }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', project: '', phase: 'Discovery', progress: 0 });
  const [newInvoiceData, setNewInvoiceData] = useState({ desc: '', amount: '' });
  const [contractUploading, setContractUploading] = useState(false);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    const clientData = {
      ...newClientData, role: 'client', milestone: "Project Start", dueDate: "TBD", status: "Active",
      activity: [{ action: "Created by Admin", date: new Date().toLocaleDateString(), status: "Completed" }],
      contracts: [], invoices: [], clientUploads: [], notifications: { email: true, push: false }
    };
    try { await addDoc(collection(db, 'clients'), clientData); setIsAddingNew(false); setNewClientData({ name: '', email: '', project: '', phase: 'Discovery', progress: 0 }); } catch (err) { alert(err.message); }
  };

  const handleDeleteClient = async (id) => { if (confirm("Remove client?")) { try { await deleteDoc(doc(db, "clients", id)); setSelectedClientId(null); } catch(err) { alert(err.message); } } };
  const handleUpdateClient = async (field, value) => { 
    try { 
      const updates = { [field]: value };
      if (field === 'progress') {
          updates.status = value === 100 ? 'Completed' : 'Active';
      }
      await updateDoc(doc(db, "clients", selectedClient.id), updates); 
    } catch (err) { console.error(err); } 
  };
  const handleAddInvoice = async () => { if(!newInvoiceData.amount || !newInvoiceData.desc) return; try { await updateDoc(doc(db, "clients", selectedClient.id), { invoices: arrayUnion({ id: `INV-${Math.floor(Math.random()*10000)}`, desc: newInvoiceData.desc, amount: `$${newInvoiceData.amount}`, date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}), status: "Pending" }) }); setNewInvoiceData({ desc: '', amount: '' }); } catch (err) { alert(err.message); } };
  const handleMarkPaid = async (i) => { const updated = [...selectedClient.invoices]; updated[i].status = "Paid"; try { await updateDoc(doc(db, "clients", selectedClient.id), { invoices: updated }); } catch(e) { console.error(e); } };

  const handleUploadContract = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    if (file.size > 1048576) { alert("File too large for free storage (Max 1MB)."); return; }
    setContractUploading(true);
    try {
      const base64 = await convertToBase64(file);
      const contract = { name: file.name, url: base64, date: new Date().toLocaleDateString(), size: (file.size/1024).toFixed(2)+" KB" };
      await updateDoc(doc(db, "clients", selectedClient.id), { contracts: arrayUnion(contract) });
    } catch(err) { alert("Upload failed: " + err.message); } finally { setContractUploading(false); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in items-start">
      <div className="w-full lg:w-1/3 flex flex-col gap-4 h-[300px] lg:h-full flex-shrink-0">
        <Button variant="accent" className="w-full justify-center py-4 rounded-xl shadow-blue-900/30" onClick={() => { setIsAddingNew(true); setSelectedClientId(null); }}><Plus size={18} /> Add New Client</Button>
        <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-xl overflow-hidden overflow-y-auto">
          {clients.map(client => (
            <div key={client.id} onClick={() => { setSelectedClientId(client.id); setIsAddingNew(false); }} className={`p-5 border-b border-zinc-800/80 cursor-pointer transition-all duration-200 group ${selectedClient?.id === client.id ? 'bg-blue-900/10 border-l-4 border-l-blue-500 pl-4' : 'hover:bg-zinc-800/40 border-l-4 border-l-transparent hover:border-l-zinc-700'}`}>
              <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold text-lg truncate ${selectedClient?.id === client.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{client.name}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold border ${client.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                      {client.status || 'Active'}
                  </span>
              </div>
              <p className="text-sm text-zinc-500 mb-3 truncate group-hover:text-zinc-400">{client.project}</p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden"><div className={`h-full rounded-full ${client.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${client.progress}%` }}></div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 h-full w-full overflow-y-auto shadow-2xl relative">
        {isAddingNew && (
          <div className="animate-fade-in max-w-xl mx-auto mt-10">
             <div className="text-center mb-10"><div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30"><Users size={32}/></div><h2 className="text-3xl font-bold text-white">Onboard New Client</h2><p className="text-zinc-500 mt-2">Create a secure workspace.</p></div>
             <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Company</label><input required className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} placeholder="e.g. Acme Corp"/></div>
                  <div><label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Email</label><input required className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} placeholder="client@acme.com"/></div>
                  <div><label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Project</label><input required className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white" value={newClientData.project} onChange={e => setNewClientData({...newClientData, project: e.target.value})} placeholder="e.g. Website Redesign"/></div>
                </div>
                <div className="pt-6 flex gap-3"><Button variant="secondary" className="flex-1 py-3" onClick={() => setIsAddingNew(false)}>Cancel</Button><Button type="submit" variant="success" className="flex-[2] py-3 font-bold">Create</Button></div>
             </form>
          </div>
        )}
        {selectedClient && !isAddingNew && (
           <div className="animate-fade-in space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-zinc-800 pb-8 gap-4">
                 <div><div className="flex items-center gap-3 mb-1"><h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">{selectedClient.name}</h2><button onClick={() => handleDeleteClient(selectedClient.id)} className="text-zinc-600 hover:text-red-500 p-2 hover:bg-zinc-800 rounded-lg"><Trash2 size={20} /></button></div><p className="text-zinc-400 flex items-center gap-2 text-sm"><Mail size={14}/> {selectedClient.email}</p></div>
                 <div className="flex items-center gap-4 self-end sm:self-center"><div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedClientId(null)}><Check size={16}/></div></div>
              </div>
              <div className="bg-black/40 rounded-2xl border border-zinc-800/50 p-1">
                <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800"><h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Briefcase size={16} className="text-purple-500"/> Project Status</h3>
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6">
                    <div><label className="text-xs text-zinc-500 mb-2 block font-medium ml-1">Current Phase</label><div className="relative w-full"><select value={selectedClient.phase} onChange={(e) => handleUpdateClient('phase', e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500"><option>Discovery</option><option>Design</option><option>Development</option><option>Testing</option><option>Live</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16}/></div></div>
                    <div><label className="text-xs text-zinc-500 mb-2 block font-medium ml-1 flex justify-between"><span>Completion</span><span className="text-white font-bold">{selectedClient.progress}%</span></label><div className="h-12 flex items-center px-1"><input type="range" min="0" max="100" value={selectedClient.progress} onChange={(e) => handleUpdateClient('progress', parseInt(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg accent-blue-500"/></div></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6"><h3 className="font-bold flex items-center gap-2 text-green-400"><DollarSign size={18}/> Invoices</h3></div>
                  <div className="flex-1 space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedClient.invoices?.map((inv, i) => (<div key={i} className="flex justify-between items-center text-sm p-3 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors"><div className="min-w-0 pr-2"><div className="text-white font-medium truncate">{inv.desc}</div><div className="text-zinc-600 text-xs">{inv.id} • {inv.date}</div></div><div className="flex items-center gap-3 flex-shrink-0"><div className="text-right"><div className="font-mono text-zinc-300">{inv.amount}</div><span className={`text-[10px] font-bold ${inv.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{inv.status}</span></div>{inv.status !== 'Paid' && (<button onClick={() => handleMarkPaid(i)} className="bg-green-500/20 hover:bg-green-500/40 text-green-500 p-1.5 rounded-full"><CheckCircle2 size={16} /></button>)}</div></div>))}
                  </div>
                  <div className="pt-4 border-t border-zinc-800"><div className="flex gap-2 flex-col sm:flex-row"><div className="flex-1 space-y-2 min-w-0"><input type="text" placeholder="Description" value={newInvoiceData.desc} onChange={e => setNewInvoiceData({...newInvoiceData, desc: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none truncate"/><div className="flex gap-2"><input type="number" placeholder="$ Amount" value={newInvoiceData.amount} onChange={e => setNewInvoiceData({...newInvoiceData, amount: e.target.value})} className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none min-w-0"/><Button variant="success" className="px-4 py-2" onClick={handleAddInvoice}><Send size={16}/></Button></div></div></div></div>
                </div>
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6"><h3 className="font-bold flex items-center gap-2 text-blue-400"><FileText size={18}/> Contracts</h3></div>
                  <div className="flex-1 space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedClient.contracts?.map((doc, i) => (<div key={i} className="flex justify-between items-center text-sm p-3 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors group"><div className="flex items-center gap-3 min-w-0"><div className="bg-blue-500/10 text-blue-500 p-2 rounded-lg flex-shrink-0"><FileText size={16}/></div><div className="min-w-0"><div className="text-white font-medium truncate max-w-[150px]">{doc.name}</div><div className="text-zinc-600 text-xs">{doc.date}</div></div></div><a href={doc.url} download={doc.name} className="text-zinc-500 hover:text-white"><Download size={16}/></a></div>))}
                  </div>
                  {/* ADMIN UPLOAD */}
                  <div className="pt-4 border-t border-zinc-800">
                    <label className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors">
                        <UploadCloud size={18} className="mr-2"/> {contractUploading ? "Saving..." : "Upload (Max 1MB)"}
                        <input type="file" className="hidden" onChange={handleUploadContract} disabled={contractUploading} />
                    </label>
                  </div>
                  {/* CLIENT UPLOADS DISPLAY */}
                  {selectedClient.clientUploads?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Client Files</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedClient.clientUploads.map((doc, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2 bg-zinc-800/50 rounded border border-zinc-700">
                            <span className="truncate text-zinc-300">{doc.name}</span>
                            <a href={doc.url} download={doc.name} className="text-blue-400 hover:text-blue-300"><Download size={14}/></a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
           </div>
        )}
        {!selectedClient && !isAddingNew && (<div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-6"><div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-inner"><Users size={48} className="opacity-50"/></div><div className="text-center"><h3 className="text-xl font-bold text-white mb-2">Select a Client</h3><p>Manage projects, invoices, and files.</p></div></div>)}
      </div>
    </div>
  );
}

// --- UPDATED ADMIN PORTAL ---
function AdminPortal({ onLogout, clients, setClients, adminSettings, setAdminSettings }) {
  const [activeTab, setActiveTab] = useState('clients'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Removed 'files' from here to keep it cleaner for now as per request
  const menuItems = [
    { id: 'clients', label: 'Clients', icon: Users }, 
    { id: 'users', label: 'User Roles', icon: Shield }, 
    { id: 'financials', label: 'Financials', icon: CreditCard }, 
    { id: 'settings', label: 'Admin Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans border-l-0 lg:border-l-4 lg:border-red-900 flex flex-col lg:flex-row">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <div className="font-bold text-red-500">ADMIN PANEL</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">{mobileMenuOpen ? <X /> : <Menu />}</button>
      </div>
      
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full backdrop-blur-md lg:backdrop-blur-none bg-black/90 lg:bg-transparent`}>
        <h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">ADMIN<span className="text-white">_PANEL</span></h2>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${activeTab === item.id ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'} ${item.id === activeTab ? 'bg-red-900/20 text-red-400 border border-red-900/50' : ''}`}
            >
              <item.icon size={18} /> {item.label}
            </div>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-2">Log Out <ArrowRight size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'clients' && <AdminClientsManager clients={clients} setClients={setClients} />}
        {activeTab === 'users' && <AdminUsersManager />}
        {activeTab === 'financials' && <AdminFinancialsView clients={clients} />}
        {activeTab === 'settings' && <AdminSettingsView settings={adminSettings} onUpdateSettings={setAdminSettings} />}
      </div>
    </div>
  );
}

// --- Main App Controller ---
export default function App() {
  const [view, setView] = useState('landing'); 
  const [userRole, setUserRole] = useState('client'); 
  const [clients, setClients] = useState([]); 
  const [currentClientData, setCurrentClientData] = useState(null); 
  const [appLoading, setAppLoading] = useState(true); 
  const [adminSettings, setAdminSettings] = useState({ name: "Admin User", email: "aapsantos07@gmail.com", maintenanceMode: false });
  const isSigningUp = useRef(false);

  // 1. AUTH STATE LISTENER (PERSISTENCE)
  useEffect(() => {
    // Safety timeout: If Firebase takes too long, force load to prevent black screen
    const safetyTimer = setTimeout(() => {
      if (appLoading) {
        console.warn("Firebase auth timed out - forcing app load.");
        setAppLoading(false);
      }
    }, 3000); // 3 seconds

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimer); // Clear timeout if auth responds

      // PREVENT RACE CONDITION: Don't read user doc if we are currently signing up
      if (isSigningUp.current) return;

      if (user) {
        const isMaster = user.email.toLowerCase() === 'aapsantos07@gmail.com';
        try {
          const docRef = doc(db, "clients", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = isMaster ? 'admin' : (data.role || 'client');
            setUserRole(role);
            setCurrentClientData({ id: user.uid, ...data });
            if (role === 'admin') { setView('admin'); } else { setView('portal'); }
          } else {
            console.log("No client doc found for user");
            setView('landing');
          }
        } catch (err) { 
            console.error("Error fetching user data on auth change:", err); 
            // If error is specifically the assertion failure, force landing page
            if (err.message && err.message.includes("INTERNAL ASSERTION FAILED")) {
                alert("Session Error: Please clear your browser cache and refresh.");
                setView('landing');
            }
        }
      } else {
        setView('landing');
        setCurrentClientData(null);
      }
      setAppLoading(false);
    });
    return () => {
        unsubscribeAuth();
        clearTimeout(safetyTimer);
    };
  }, []);

  // 2. DATA LISTENER (REAL-TIME UPDATES)
  useEffect(() => {
    if (appLoading) return;
    if (!currentClientData && userRole !== 'admin') return;

    let unsubscribe;

    if (userRole === 'admin') {
       const q = collection(db, "clients");
       unsubscribe = onSnapshot(q, (snapshot) => {
         const liveClients = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
         setClients(liveClients);
       }, (err) => console.log("Admin listen error", err));
    } 
    else if (userRole === 'client' && currentClientData?.id) {
       const docRef = doc(db, "clients", currentClientData.id);
       unsubscribe = onSnapshot(docRef, (docSnap) => {
         if (docSnap.exists()) {
           setCurrentClientData({ id: docSnap.id, ...docSnap.data() });
         }
       }, (err) => console.log("Client listen error", err));
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [userRole, currentClientData?.id, appLoading]);

  const handleLogin = (role, clientData) => {
    setUserRole(role);
    if (role === 'admin') { setView('admin'); } else { setCurrentClientData(clientData); setView('portal'); }
  };

  const handleClientUpdate = async (updatedClient) => {
    try { 
        // UPDATED: Added 'project' field to updated list so the modal works!
        await updateDoc(doc(db, 'clients', updatedClient.id), { 
            name: updatedClient.name, 
            notifications: updatedClient.notifications,
            project: updatedClient.project 
        }); 
    } catch(e) { console.error("Update failed", e); }
  };

  const handleClientDelete = async (id) => {
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      try { await deleteDoc(doc(db, 'clients', id)); await signOut(auth); setView('landing'); } catch(e) { alert(e.message); }
    }
  };

  const handleAuthSubmit = async (isSignUp, email, password, name) => {
    const isMasterAdmin = email.toLowerCase() === 'aapsantos07@gmail.com';
    if (adminSettings.maintenanceMode && isSignUp && !isMasterAdmin) return { error: "New signups are disabled during maintenance." };
    try {
        let user; let uid;
        if (isSignUp) {
            isSigningUp.current = true; // LOCK LISTENER to prevent race condition
            const userCredential = await createUserWithEmailAndPassword(auth, email, password); user = userCredential.user; uid = user.uid;
            const role = isMasterAdmin ? 'admin' : 'client';
            const clientData = {
                id: uid, name: name || (isMasterAdmin ? "Master Admin" : "New User"), email: email, role: role, 
                project: isMasterAdmin ? "WebFront AI System" : "New Project", phase: "Discovery", progress: 0, milestone: "Onboarding", dueDate: "TBD", revenue: 0, status: "Active",
                activity: [{ action: "Account Created", date: new Date().toLocaleDateString(), status: "Completed" }], invoices: [], contracts: [], clientUploads: [], notifications: { email: true, push: false }
            };
            await setDoc(doc(db, "clients", uid), clientData); 
            handleLogin(role, clientData);
            isSigningUp.current = false; // UNLOCK
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, email, password); user = userCredential.user; uid = user.uid;
            const clientDocSnap = await getDoc(doc(db, "clients", uid));
            if (clientDocSnap.exists()) {
                const userData = clientDocSnap.data();
                const userRole = isMasterAdmin ? 'admin' : (userData.role || 'client');
                handleLogin(userRole, userData);
            } else {
                if (isMasterAdmin) {
                    const adminData = { id: uid, name: "Master Admin", email: email, role: 'admin', project: "System Admin", phase: "Admin", progress: 100, milestone: "N/A", dueDate: "N/A", revenue: 0, status: "Active", activity: [], invoices: [], contracts: [], clientUploads: [] };
                    await setDoc(doc(db, "clients", uid), adminData); handleLogin('admin', adminData);
                } else { await signOut(auth); return { error: "User data not found. Please contact support." }; }
            }
        }
        return { error: null };
    } catch (firebaseError) {
        isSigningUp.current = false; // Unlock if error
        console.error("Auth Error:", firebaseError);
        if (firebaseError.code === 'auth/email-already-in-use') return { error: "Email already in use." };
        if (firebaseError.code === 'auth/invalid-credential') return { error: "Invalid email or password." };
        return { error: firebaseError.message };
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-10 h-10" />
      </div>
    );
  }

  return (
    <>
      {view === 'landing' && <LandingPage onLogin={() => setView('auth')} />}
      {view === 'auth' && <AuthScreen onAuthSubmit={handleAuthSubmit} onBack={() => setView('landing')} maintenanceMode={adminSettings.maintenanceMode} />}
      {view === 'portal' && currentClientData && <ClientPortal onLogout={() => signOut(auth)} clientData={currentClientData} onUpdateClient={handleClientUpdate} onDeleteAccount={handleClientDelete} />}
      {view === 'admin' && <AdminPortal onLogout={() => signOut(auth)} clients={clients} setClients={setClients} adminSettings={adminSettings} setAdminSettings={setAdminSettings} />}
    </>
  );
}