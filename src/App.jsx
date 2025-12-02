import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Code, Cpu, ArrowRight, Check, Menu, X, ChevronDown, Lock, 
  LayoutDashboard, FileText, CreditCard, Settings, Send, User, Bot, Palette, 
  Brain, Headphones, TrendingUp, LogIn, Download, Bell, Shield, Mail, Sparkles, 
  Loader2, Users, BarChart3, Briefcase, Edit3, Plus, Save, Trash2, Search, 
  DollarSign, Activity, UploadCloud, XCircle, CheckCircle2, LogOut, AlertTriangle, Power
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged // <--- NEW: Necessary for persistent login
} from 'firebase/auth';

import { 
  doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs, addDoc, deleteDoc, arrayUnion
} from 'firebase/firestore';

// --- LOCAL FIREBASE CONFIG ---
import { auth, db, storage } from './firebase'; 
// --------------------------------

const apiKey = ""; // injected at runtime

// --- Helper: Convert File to Base64 ---
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// --- API Logic ---
const callGemini = async (userQuery, systemPrompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I couldn't process that request.";
    } catch (error) {
      if (i === 2) return "System overload. Please try again later.";
      await delay(1000 * Math.pow(2, i));
    }
  }
};

// --- Helper Components ---
function Button({ children, variant = 'primary', className = '', onClick, type="button", title="" }) {
  const baseStyle = "px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-lg",
    secondary: "bg-transparent border border-zinc-700 text-white hover:border-white hover:bg-zinc-900",
    accent: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20",
    success: "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
  };
  return <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>{children}</button>;
}

function Card({ children, className = '' }) {
  return <div className={`bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-colors duration-300 ${className}`}>{children}</div>;
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
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
      <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="font-mono text-sm text-zinc-400">WEBFRONT_AI</span></div>
        <Sparkles size={18} className="text-blue-400" />
      </div>
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'}`}>
              {formatMessage(m.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 p-3 rounded-lg rounded-bl-none flex gap-1 items-center">
              <Loader2 size={14} className="animate-spin text-zinc-500" />
              <span className="text-xs text-zinc-500 ml-2">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
          placeholder="Ask about pricing, services..."
          className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
        />
        <button onClick={handleSend} className="bg-white text-black p-2 rounded-lg hover:bg-gray-200 transition-colors">
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] -z-10"></div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-12 h-12 bg-white text-black rounded-xl mb-4"><Cpu size={24} /></div>
           <h1 className="text-2xl font-bold tracking-tighter">{isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome Back')}</h1>
           <p className="text-zinc-500 mt-2">{isForgotPassword ? 'Enter your email to receive a reset link' : (isSignUp ? 'Join WebFront AI today' : 'Sign in to your WebFront Dashboard')}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {maintenanceMode && !isSignUp && !isForgotPassword && (<div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertTriangle size={16} /> Maintenance Mode Active</div>)}
          <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20">{error}</div>}
            {successMessage && <div className="bg-green-500/10 text-green-500 text-sm p-3 rounded-lg border border-green-500/20">{successMessage}</div>}
            {isSignUp && !isForgotPassword && (
              <div className="animate-fade-in">
                <label className="block text-sm text-zinc-400 mb-2 font-medium">Full Name / Company</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Acme Corp" required={isSignUp} />
              </div>
            )}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="name@company.com" required />
            </div>
            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-zinc-400 font-medium">Password</label>
                  {!isSignUp && (<button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }} className="text-xs text-blue-400 hover:text-blue-300">Forgot Password?</button>)}
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="••••••••" required />
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

// --- Portal Views ---
function ClientDashboardView({ data }) {
  const totalOpenBalance = data.invoices?.reduce((acc, inv) => inv.status !== 'Paid' ? acc + (parseFloat(inv.amount.replace(/[^0-9.-]+/g, "")) || 0) : acc, 0) || 0;
  const formattedBalance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalOpenBalance);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-12">
        <div><h1 className="text-3xl font-bold mb-1">Welcome back, {data.name}</h1><p className="text-zinc-500">Project: {data.project}</p></div>
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">{data.name?.charAt(0) || 'U'}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <h3 className="text-zinc-400 text-sm mb-1">Current Phase</h3><p className="text-2xl font-bold truncate">{data.phase}</p>
          <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden"><div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${data.progress}%` }}></div></div><p className="text-right text-xs text-blue-400 mt-1">{data.progress}% Complete</p>
        </Card>
        <Card><h3 className="text-zinc-400 text-sm mb-1">Next Milestone</h3><p className="text-2xl font-bold truncate">{data.milestone}</p><p className="text-zinc-500 text-sm mt-2">Due: {data.dueDate}</p></Card>
        <Card><h3 className="text-zinc-400 text-sm mb-1">Open Invoices</h3><p className="text-2xl font-bold">{formattedBalance}</p><p className="text-green-500 text-sm mt-2 flex items-center gap-1">{totalOpenBalance > 0 ? <span className="text-yellow-500 flex items-center gap-1"><Activity size={14}/> Action Required</span> : <><Check size={14}/> All paid</>}</p></Card>
      </div>
      <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
        {data.activity && data.activity.length > 0 ? data.activity.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div><span className="truncate max-w-[200px] sm:max-w-md">{item.action}</span></div><span className="text-zinc-500 text-sm whitespace-nowrap ml-4">{item.date}</span>
            </div>
        )) : <div className="p-4 text-zinc-500 text-center">No recent activity</div>}
      </div>
    </div>
  );
}

function ContractsView({ data }) {
  const [uploading, setUploading] = useState(false);
  
  // Free Base64 Upload Handler for CLIENT
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
  <div className="animate-fade-in">
    <div className="mb-8"><h1 className="text-3xl font-bold mb-1">Documents & Files</h1><p className="text-zinc-500">Access contracts and upload your project files.</p></div>
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20}/> Contracts & Agreements</h3>
      <div className="space-y-4">
        {data.contracts && data.contracts.length > 0 ? data.contracts.map((doc, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-center justify-between hover:border-zinc-600 transition-all">
            <div className="flex items-center gap-4 min-w-0"><div className="w-12 h-12 bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-500"><FileText size={24} /></div><div className="min-w-0"><h3 className="font-bold text-white truncate">{doc.name}</h3><p className="text-sm text-zinc-500">Shared by Admin • {doc.date} • {doc.size}</p></div></div><a href={doc.url} download={doc.name} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full flex-shrink-0"><Download size={20} /></a>
          </div>
        )) : <div className="p-8 text-center text-zinc-500 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">No contracts available yet.</div>}
      </div>
    </div>
    <div>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><UploadCloud size={20}/> Your Project Uploads</h3>
      <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 p-6 mb-4">
         <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">{uploading ? <Loader2 className="animate-spin text-blue-500 mb-2"/> : <UploadCloud className="w-8 h-8 text-zinc-500 mb-2" />}<p className="text-sm text-zinc-500">{uploading ? "Saving to Database..." : "Click to upload (Max 1MB)"}</p></div>
            <input type="file" className="hidden" onChange={handleClientUpload} disabled={uploading} />
         </label>
      </div>
      <div className="space-y-4">
        {data.clientUploads && data.clientUploads.length > 0 ? data.clientUploads.map((doc, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0"><div className="w-10 h-10 bg-green-900/20 text-green-500 rounded-lg flex-shrink-0 flex items-center justify-center"><Check size={20} /></div><div className="min-w-0"><h3 className="font-bold text-white truncate">{doc.name}</h3><p className="text-sm text-zinc-500">Uploaded by You • {doc.date} • {doc.size}</p></div></div><a href={doc.url} download={doc.name} className="text-blue-400 hover:text-blue-300 p-2"><Download size={20}/></a>
          </div>
        )) : null}
      </div>
    </div>
  </div>
  );
}

function InvoicesView({ data }) {
  return (
  <div className="animate-fade-in">
    <div className="mb-8 flex justify-between items-end"><div><h1 className="text-3xl font-bold mb-1">Invoices</h1><p className="text-zinc-500">View payment history and upcoming charges.</p></div><Button variant="secondary" className="px-4 py-2 text-xs">Download All CSV</Button></div>
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-4 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50"><div>Description</div><div>Date</div><div className="text-right">Amount</div></div>
      {data.invoices && data.invoices.length > 0 ? data.invoices.map((inv, i) => (
          <div key={i} className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors items-center">
            <div className="col-span-2 min-w-0"><div className="font-bold truncate pr-4">{inv.desc}</div><div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">{inv.id} <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${inv.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{inv.status}</span></div></div>
            <div className="text-zinc-400 text-sm">{inv.date}</div><div className="text-right font-mono">{inv.amount}</div>
          </div>
      )) : <div className="p-4 text-center text-zinc-500">No invoices found.</div>}
    </div>
  </div>
  );
}

function AIAssistantView({ data }) {
  const [messages, setMessages] = useState([{ role: 'ai', text: `I'm your dedicated Project Intelligence Agent. I have full context on your build (${data.progress}% complete). How can I help you today?` }]);
  const [input, setInput] = useState(''); const [isTyping, setIsTyping] = useState(false); const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) { scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); } }, [messages]);
  const handleSend = async (text) => {
    const userText = text || input; if (!userText.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: userText }]); setInput(''); setIsTyping(true);
    const systemPrompt = `You are a dedicated AI Project Manager for a client named "${data.name}". Context: Current Phase: ${data.phase}, Progress: ${data.progress}%, Next Milestone: ${data.milestone}, Due: ${data.dueDate}. Tone: Professional.`;
    const response = await callGemini(userText, systemPrompt);
    setMessages(prev => [...prev, { role: 'ai', text: response }]); setIsTyping(false);
  };
  const quickActions = ["Draft an email to my team about the launch", "Explain what 'Database Schema' means", "Summarize my project status"];
  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="mb-6"><h1 className="text-3xl font-bold mb-1 flex items-center gap-3">AI Project Assistant <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-600/50">BETA</span></h1><p className="text-zinc-500">Your intelligent guide for this project build.</p></div>
      <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden mb-6">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'}`}>{m.text.split('\n').map((line, j) => <p key={j} className={line ? "mb-2 last:mb-0" : "h-2"}>{line}</p>)}</div></div>))}
          {isTyping && <div className="flex justify-start"><div className="bg-zinc-800 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2"><Loader2 size={16} className="animate-spin text-zinc-400" /><span className="text-zinc-400 text-sm">Analyzing project data...</span></div></div>}
        </div>
        {messages.length === 1 && <div className="px-6 pb-2 flex gap-2 flex-wrap">{quickActions.map((action, i) => <button key={i} onClick={() => handleSend(action)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg border border-zinc-700 transition-colors">{action}</button>)}</div>}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }} placeholder="Ask me anything..." className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" />
          <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
}

// --- SETTINGS & ADMIN COMPONENTS ---
function SettingsView({ data, onUpdateClient, onDeleteAccount }) {
  const [name, setName] = useState(data.name || "");
  const [notifications, setNotifications] = useState(data.notifications || { email: true, push: false });
  const handleSave = () => { onUpdateClient({ ...data, name, notifications }); };
  const toggleNotification = (type) => { setNotifications(prev => ({ ...prev, [type]: !prev[type] })); };
  return (
  <div className="animate-fade-in"><div className="mb-8"><h1 className="text-3xl font-bold mb-1">Settings</h1><p className="text-zinc-500">Manage your account preferences.</p></div><div className="grid gap-8 max-w-2xl"><div className="space-y-4"><h3 className="text-lg font-bold flex items-center gap-2"><User size={18}/> Profile Details</h3><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-zinc-500 mb-1">Company / Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div><div><label className="block text-xs font-medium text-zinc-500 mb-1">Email (Locked)</label><input type="text" value={data.email} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed" /></div></div><Button onClick={handleSave} className="text-sm py-2 px-4">Save Changes</Button></div><div className="space-y-4 pt-4 border-t border-zinc-800"><h3 className="text-lg font-bold flex items-center gap-2 text-red-500"><Shield size={18}/> Danger Zone</h3><Button onClick={() => onDeleteAccount(data.id)} variant="danger" className="w-full justify-start">Delete My Account</Button></div></div></div>
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
    try { await updateDoc(doc(db, "clients", userId), { role: newRole }); } catch (error) { alert("Error updating role: " + error.message); }
  };
  return (
    <div className="animate-fade-in">
      <div className="mb-8"><h1 className="text-3xl font-bold mb-1">User Management</h1><p className="text-zinc-500">Manage user roles and permissions.</p></div>
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50"><div className="col-span-4">User / Email</div><div className="col-span-3">Project</div><div className="col-span-3">Current Role</div><div className="col-span-2 text-right">Actions</div></div>
        {loading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto"/></div> : users.map((user) => (
            <div key={user.id} className="grid grid-cols-12 p-4 border-b border-zinc-800 last:border-0 items-center hover:bg-zinc-800/20 transition-colors">
              <div className="col-span-4 min-w-0 pr-4"><div className="font-bold text-white truncate">{user.name}</div><div className="text-xs text-zinc-500 truncate">{user.email}</div></div><div className="col-span-3 text-zinc-400 text-sm truncate">{user.project}</div>
              <div className="col-span-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>{user.role || 'CLIENT'}</span></div>
              <div className="col-span-2 text-right"><button onClick={() => toggleAdminRole(user.id, user.role)} className={`text-xs px-3 py-1.5 rounded transition-colors ${user.role === 'admin' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-white text-black hover:bg-gray-200 font-bold'}`}>{user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}</button></div>
            </div>
        ))}
      </div>
    </div>
  );
}

function AdminFinancialsView({ clients }) {
  const totalRevenue = clients.reduce((sum, c) => sum + (c.invoices?.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount.replace(/[^0-9.-]+/g, "")), 0) || 0), 0);
  const totalOutstanding = clients.reduce((sum, c) => sum + (c.invoices?.filter(i => i.status !== 'Paid').reduce((s, i) => s + parseFloat(i.amount.replace(/[^0-9.-]+/g, "")), 0) || 0), 0);
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const allTransactions = clients.flatMap(client => (client.invoices || []).map(inv => ({ ...inv, clientName: client.name })));
  return (
  <div className="animate-fade-in"><div className="mb-8"><h1 className="text-3xl font-bold mb-1">Financials</h1><p className="text-zinc-500">Revenue tracking based on active client deals.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><Card><h3 className="text-zinc-400 text-sm mb-1">Total Revenue</h3><p className="text-3xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p></Card><Card><h3 className="text-zinc-400 text-sm mb-1">Outstanding</h3><p className="text-3xl font-bold text-yellow-500">{formatCurrency(totalOutstanding)}</p></Card><Card><h3 className="text-zinc-400 text-sm mb-1">Active Deals</h3><p className="text-3xl font-bold text-blue-500">{clients.length}</p></Card></div><h3 className="text-xl font-bold mb-6">All Transactions</h3><div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden"><div className="grid grid-cols-4 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50"><div>Client</div><div>Date</div><div>Invoice ID</div><div className="text-right">Amount</div></div>{allTransactions.map((t, i) => (<div key={i} className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors"><div className="text-white font-medium truncate">{t.clientName}</div><div className="text-zinc-500">{t.date}</div><div className="text-zinc-500 font-mono text-xs pt-1">{t.id}</div><div className={`text-right font-mono ${t.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{t.amount}</div></div>))}{allTransactions.length === 0 && <div className="p-4 text-center text-zinc-500">No transactions recorded.</div>}</div></div>
  );
}

function AdminSettingsView({ settings, onUpdateSettings }) {
  const [name, setName] = useState(settings.name);
  return (
  <div className="animate-fade-in"><div className="mb-8"><h1 className="text-3xl font-bold mb-1">Admin Settings</h1><p className="text-zinc-500">System configuration and profile.</p></div><div className="max-w-2xl space-y-8"><div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6"><h3 className="text-lg font-bold mb-4">Admin Profile</h3><div className="grid grid-cols-2 gap-4 mb-4"><div><label className="block text-xs font-medium text-zinc-500 mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-xs font-medium text-zinc-500 mb-1">Email</label><input type="text" defaultValue={settings.email} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed" /></div></div><Button onClick={() => onUpdateSettings({ ...settings, name })} variant="secondary" className="text-sm py-2 px-4">Update Profile</Button></div><div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6"><h3 className="text-lg font-bold mb-4">System Preferences</h3><div className="flex items-center justify-between p-3 bg-red-900/10 border border-red-900/30 rounded-lg"><div className="flex flex-col"><span className="text-white font-bold flex items-center gap-2"><Power size={16}/> Maintenance Mode</span><span className="text-xs text-zinc-400">Prevents all clients from logging in. Admin only.</span></div><div onClick={() => onUpdateSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div></div></div></div></div></div>
  );
}

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
  const handleUpdateClient = async (field, value) => { try { await updateDoc(doc(db, "clients", selectedClient.id), { [field]: value }); } catch (err) { console.error(err); } };
  const handleAddInvoice = async () => { if(!newInvoiceData.amount || !newInvoiceData.desc) return; try { await updateDoc(doc(db, "clients", selectedClient.id), { invoices: arrayUnion({ id: `INV-${Math.floor(Math.random()*10000)}`, desc: newInvoiceData.desc, amount: `$${newInvoiceData.amount}`, date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}), status: "Pending" }) }); setNewInvoiceData({ desc: '', amount: '' }); } catch (err) { alert(err.message); } };
  const handleMarkPaid = async (i) => { const updated = [...selectedClient.invoices]; updated[i].status = "Paid"; try { await updateDoc(doc(db, "clients", selectedClient.id), { invoices: updated }); } catch(e) { console.error(e); } };

  // FREE ADMIN UPLOAD (BASE64)
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
              <div className="flex justify-between items-start mb-1"><span className={`font-bold text-lg truncate ${selectedClient?.id === client.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{client.name}</span><span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-400 px-2 py-1 rounded-full font-bold border border-green-500/20">Active</span></div>
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

// --- Portal Wrappers ---
function AdminPortal({ onLogout, clients, setClients, adminSettings, setAdminSettings }) {
  const [activeTab, setActiveTab] = useState('clients'); const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuItems = [{ id: 'clients', label: 'Clients', icon: Users }, { id: 'users', label: 'User Roles', icon: Shield }, { id: 'financials', label: 'Financials', icon: CreditCard }, { id: 'settings', label: 'Admin Settings', icon: Settings }];
  return (
    <div className="min-h-screen bg-black text-white font-sans border-l-0 lg:border-l-4 lg:border-red-900 flex flex-col lg:flex-row">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900"><div className="font-bold text-red-500">ADMIN PANEL</div><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">{mobileMenuOpen ? <X /> : <Menu />}</button></div>
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full`}><h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">ADMIN<span className="text-white">_PANEL</span></h2><nav className="space-y-2 flex-1">{menuItems.map((item) => (<div key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${activeTab === item.id ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'} ${item.id === activeTab ? 'bg-red-900/20 text-red-400 border border-red-900/50' : ''}`}><item.icon size={18} /> {item.label}</div>))}</nav><button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-2">Log Out <ArrowRight size={14} /></button></div>
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'clients' && <AdminClientsManager clients={clients} setClients={setClients} />}
        {activeTab === 'users' && <AdminUsersManager />}
        {activeTab === 'financials' && <AdminFinancialsView clients={clients} />}
        {activeTab === 'settings' && <AdminSettingsView settings={adminSettings} onUpdateSettings={setAdminSettings} />}
      </div>
    </div>
  );
}

function ClientPortal({ onLogout, clientData, onUpdateClient, onDeleteAccount }) {
  const [activeTab, setActiveTab] = useState('dashboard'); const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuItems = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, highlight: true }, { id: 'contracts', label: 'Contracts', icon: FileText }, { id: 'invoices', label: 'Invoices', icon: CreditCard }, { id: 'settings', label: 'Settings', icon: Settings }];
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col lg:flex-row">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900"><div className="font-bold">WEBFRONT_OS</div><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">{mobileMenuOpen ? <X /> : <Menu />}</button></div>
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full`}><h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">WEBFRONT<span className="text-blue-500">_OS</span></h2><nav className="space-y-2 flex-1">{menuItems.map((item) => (<div key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${activeTab === item.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'} ${item.highlight ? 'border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20' : ''}`}><item.icon size={18} className={item.highlight ? 'text-blue-400' : ''} /> <span className={item.highlight ? 'text-blue-100 font-medium' : ''}>{item.label}</span></div>))}</nav><button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-2">Log Out <ArrowRight size={14} /></button></div>
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'dashboard' && <ClientDashboardView data={clientData} />}
        {activeTab === 'ai-assistant' && <AIAssistantView data={clientData} />}
        {activeTab === 'contracts' && <ContractsView data={clientData} />}
        {activeTab === 'invoices' && <InvoicesView data={clientData} />}
        {activeTab === 'settings' && <SettingsView data={clientData} onUpdateClient={onUpdateClient} onDeleteAccount={onDeleteAccount} />}
      </div>
    </div>
  );
}

function LandingPage({ onLogin }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false); const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 50); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-zinc-800 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center"><div className="text-2xl font-bold tracking-tighter flex items-center gap-2"><div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg"><Cpu size={20} /></div>WEBFRONT AI</div><div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400"><a href="#services" className="hover:text-white transition-colors">Services</a><a href="#demo" className="hover:text-white transition-colors">AI Demo</a><a href="#pricing" className="hover:text-white transition-colors">Pricing</a><button onClick={() => onLogin()} className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"><LogIn size={14} /> Login</button><Button variant="primary">Book Strategy Call</Button></div><button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X /> : <Menu />}</button></div>
        {isMenuOpen && (<div className="md:hidden absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 p-6 flex flex-col gap-4"><a href="#services" onClick={() => setIsMenuOpen(false)}>Services</a><a href="#demo" onClick={() => setIsMenuOpen(false)}>AI Demo</a><a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a><button onClick={() => onLogin()} className="text-left">Login</button></div>)}
      </nav>
      <section className="pt-40 pb-20 relative overflow-hidden"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div><div className="container mx-auto px-6 text-center"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono mb-8 animate-fade-in-up"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>ACCEPTING NEW CLIENTS FOR Q4</div><h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">ELEVATE YOUR <br /> DIGITAL REALITY.</h1><p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">WebFront AI builds high-performance websites and autonomous AI receptionists that work while you sleep. The future isn't coming—it's hired.</p><div className="flex flex-col md:flex-row justify-center gap-4 items-center"><Button variant="primary">Start Project</Button><Button variant="secondary">View Portfolio</Button></div></div></section>
      <section className="py-12 border-y border-zinc-900 bg-zinc-950/50"><div className="container mx-auto px-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-8"><div className="flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2"><Palette size={24} /></div><h3 className="font-bold text-lg">Design</h3><p className="text-sm text-zinc-500">Minimalist aesthetics that convert.</p></div><div className="flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2"><Brain size={24} /></div><h3 className="font-bold text-lg">Intelligence</h3><p className="text-sm text-zinc-500">Autonomous agents trained on your data.</p></div><div className="flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2"><Headphones size={24} /></div><h3 className="font-bold text-lg">Support</h3><p className="text-sm text-zinc-500">24/7 reliability for your customers.</p></div><div className="flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2"><TrendingUp size={24} /></div><h3 className="font-bold text-lg">Growth</h3><p className="text-sm text-zinc-500">Scalable architecture for the future.</p></div></div></div></section>
      <section id="services" className="py-24 bg-zinc-950"><div className="container mx-auto px-6"><div className="mb-16"><h2 className="text-3xl md:text-5xl font-bold mb-6">OUR SERVICES</h2><div className="w-20 h-1 bg-blue-600"></div></div><div className="grid md:grid-cols-2 gap-8"><Card className="group cursor-pointer"><div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors duration-300"><Code size={24} /></div><h3 className="text-2xl font-bold mb-4">Web Development</h3><p className="text-zinc-400 leading-relaxed mb-6">Custom-coded React & Next.js applications designed for speed, SEO, and conversion. We don't use templates; we architect experiences.</p><ul className="space-y-2 text-zinc-500"><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> High-Performance Animations</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> CMS Integration</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Dark Mode Optimized</li></ul></Card><Card className="group cursor-pointer"><div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300"><MessageSquare size={24} /></div><h3 className="text-2xl font-bold mb-4">AI Receptionists</h3><p className="text-zinc-400 leading-relaxed mb-6">Intelligent agents that handle customer support, booking, and inquiries 24/7. Train them on your data and let them run your front desk.</p><ul className="space-y-2 text-zinc-500"><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Natural Language Processing</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Calendar Integration</li><li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Voice & Chat Support</li></ul></Card></div></div></section>
      <section id="demo" className="py-24 relative overflow-hidden"><div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-16"><div className="flex-1"><div className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-bold tracking-widest mb-6">LIVE PREVIEW</div><h2 className="text-4xl md:text-6xl font-bold mb-6">TALK TO THE <br /> MACHINE.</h2><p className="text-zinc-400 text-lg mb-8 max-w-md">Test our AI receptionist instantly. It can answer questions about our pricing, services, and availability. No human required.</p><div className="flex items-center gap-4 text-sm text-zinc-500"><div className="flex -space-x-3">{[1,2,3].map(i => (<div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-xs">U{i}</div>))}</div><p>Trusted by 50+ agencies</p></div></div><div className="flex-1 w-full flex justify-center md:justify-end"><AIChatDemo /></div></div></section>
      <section id="pricing" className="py-24 bg-zinc-950 border-t border-zinc-900"><div className="container mx-auto px-6"><h2 className="text-4xl font-bold text-center mb-16">TRANSPARENT PRICING</h2><div className="grid md:grid-cols-3 gap-8">{[{ title: 'Starter', price: '$2,500', sub: 'One-time', features: ['Custom Landing Page', 'Mobile Responsive', 'Basic SEO', '1 Week Support'] }, { title: 'Growth', price: '$4,500', sub: 'One-time', features: ['Multi-page Website', 'CMS Integration', 'Advanced Animations', 'AI Chatbot Setup'] }, { title: 'Agency', price: '$8,000+', sub: 'Custom Quote', features: ['Full Web App', 'User Authentication', 'Payment Integration', 'Custom AI Training'] }].map((tier, index) => (<Card key={index} className={`relative flex flex-col ${index === 1 ? 'border-blue-600 bg-zinc-900' : 'bg-transparent'}`}>{index === 1 && (<div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded-full">MOST POPULAR</div>)}<h3 className="text-xl font-bold mb-2">{tier.title}</h3><div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold">{tier.price}</span><span className="text-zinc-500 text-sm">{tier.sub}</span></div><div className="space-y-4 mb-8 flex-1">{tier.features.map((f, i) => (<div key={i} className="flex items-center gap-3 text-sm text-zinc-300"><Check size={14} className="text-blue-500 flex-shrink-0" /> {f}</div>))}</div><Button variant={index === 1 ? 'accent' : 'secondary'} className="w-full">Get Started</Button></Card>))}</div></div></section>
      <footer className="py-12 border-t border-zinc-900 text-center md:text-left"><div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6"><div className="text-xl font-bold tracking-tighter">WEBFRONT AI</div><div className="text-zinc-500 text-sm">© 2024 WebFront AI. Built for the future.</div><div className="flex gap-6 text-zinc-400"><a href="#" className="hover:text-white transition-colors">Twitter</a><a href="#" className="hover:text-white transition-colors">LinkedIn</a><a href="#" className="hover:text-white transition-colors">Instagram</a></div></div></footer>
    </div>
  );
}

// --- Main App Controller ---
export default function App() {
  const [view, setView] = useState('landing'); 
  const [userRole, setUserRole] = useState('client'); 
  const [clients, setClients] = useState([]); 
  const [currentClientData, setCurrentClientData] = useState(null); 
  const [appLoading, setAppLoading] = useState(true); // <--- NEW: Loading state
  const [adminSettings, setAdminSettings] = useState({ name: "Admin User", email: "aapsantos07@gmail.com", maintenanceMode: false });

  // 1. AUTH STATE LISTENER (PERSISTENCE)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        const isMaster = user.email.toLowerCase() === 'aapsantos07@gmail.com';
        
        // Fetch user doc to get role
        try {
          const docRef = doc(db, "clients", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = isMaster ? 'admin' : (data.role || 'client');
            
            setUserRole(role);
            setCurrentClientData({ id: user.uid, ...data });
            
            if (role === 'admin') {
              setView('admin');
            } else {
              setView('portal');
            }
          } else {
            // Doc missing but auth exists (rare edge case)
            console.log("No client doc found for user");
            setView('landing');
          }
        } catch (err) {
          console.error("Error fetching user data on auth change:", err);
        }
      } else {
        // User is signed out.
        setView('landing');
        setCurrentClientData(null);
      }
      setAppLoading(false);
    });
    
    return () => unsubscribeAuth();
  }, []);

  // 2. DATA LISTENER (REAL-TIME UPDATES)
  useEffect(() => {
    // Wait until auth check is done
    if (appLoading) return;

    // If no user data is loaded yet (and not admin), we can't set up listeners
    if (!currentClientData && userRole !== 'admin') return;

    let unsubscribe;

    if (userRole === 'admin') {
       // Admin listens to ALL clients
       const q = collection(db, "clients");
       unsubscribe = onSnapshot(q, (snapshot) => {
         const liveClients = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
         setClients(liveClients);
       }, (err) => console.log("Admin listen error", err));
    } 
    else if (userRole === 'client' && currentClientData?.id) {
       // Client listens ONLY to their own doc (fixes permission error)
       const docRef = doc(db, "clients", currentClientData.id);
       unsubscribe = onSnapshot(docRef, (docSnap) => {
         if (docSnap.exists()) {
           // Update local state immediately when doc changes (e.g. after upload)
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
    try { await updateDoc(doc(db, 'clients', updatedClient.id), { name: updatedClient.name, notifications: updatedClient.notifications }); } catch(e) { console.error("Update failed", e); }
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password); user = userCredential.user; uid = user.uid;
            const role = isMasterAdmin ? 'admin' : 'client';
            const clientData = {
                id: uid, name: name || (isMasterAdmin ? "Master Admin" : "New User"), email: email, role: role, 
                project: isMasterAdmin ? "WebFront AI System" : "New Project", phase: "Discovery", progress: 0, milestone: "Onboarding", dueDate: "TBD", revenue: 0, status: "Active",
                activity: [{ action: "Account Created", date: new Date().toLocaleDateString(), status: "Completed" }], invoices: [], contracts: [], clientUploads: [], notifications: { email: true, push: false }
            };
            await setDoc(doc(db, "clients", uid), clientData); handleLogin(role, clientData);
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