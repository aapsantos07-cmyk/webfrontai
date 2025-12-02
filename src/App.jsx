import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Code, 
  Cpu, 
  ArrowRight, 
  Check, 
  Menu, 
  X, 
  ChevronDown, 
  Lock, 
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  Send,
  User,
  Bot,
  Palette,
  Brain,
  Headphones,
  TrendingUp,
  LogIn,
  Download,
  Bell,
  Shield,
  Mail,
  Sparkles,
  Loader2,
  Users,
  BarChart3,
  Briefcase,
  Edit3,
  Plus,
  Save,
  Trash2,
  Search,
  DollarSign,
  Activity,
  UploadCloud,
  XCircle,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Power
} from 'lucide-react';

// --- FIREBASE IMPORT ---
// We use './firebase' without extension so the bundler finds .js or .jsx automatically
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
// --------------------------------

// --- API Configuration ---
const apiKey = ""; // injected at runtime

// --- Helper: Mock Database (Only used for initial state/admin view persistence simulation) ---
// NOTE: Client login/signup now uses real Firebase Auth and Firestore for persistence.
const INITIAL_CLIENTS = [
  { 
    id: 'mock_client_1', // Using mock IDs for initial data only
    name: "Tech Corp Inc.", 
    email: "client@techcorp.com", 
    project: "SaaS Platform V2", 
    phase: "Development", 
    progress: 65, 
    milestone: "AI Integration", 
    dueDate: "Nov 12, 2024", 
    revenue: 12500,
    status: "Active",
    activity: [
      { action: "Wireframes Approved", date: "Oct 24", status: "Completed" },
      { action: "Database Schema Finalized", date: "Oct 25", status: "Completed" }
    ],
    invoices: [
      { id: "INV-209", desc: "Initial Deposit (50%)", amount: "$4,000.00", date: "Oct 24", status: "Paid" },
      { id: "INV-210", desc: "Milestone 2 Payment", amount: "$2,500.00", date: "Nov 02", status: "Pending" }
    ],
    contracts: [
      { name: "Master Service Agreement.pdf", date: "Oct 20, 2024", size: "2.4 MB" }
    ],
    notifications: { email: true, push: false, monthly: true }
  },
  { 
    id: 'mock_client_2', 
    name: "Dr. Smith Dental", 
    email: "doc@smith.com", 
    project: "AI Receptionist Bot", 
    phase: "Training", 
    progress: 30, 
    milestone: "Voice Calibration", 
    dueDate: "Dec 01, 2024", 
    revenue: 4500,
    status: "Active",
    activity: [
      { action: "Contract Signed", date: "Nov 01", status: "Completed" }
    ],
    invoices: [
      { id: "INV-208", desc: "Consultation Fee", amount: "$500.00", date: "Nov 01", status: "Paid" }
    ],
    contracts: [
      { name: "HIPAA Compliance Agreement.pdf", date: "Nov 01, 2024", size: "1.1 MB" }
    ],
    notifications: { email: true, push: true, monthly: false }
  }
];

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

const Button = ({ children, variant = 'primary', className = '', onClick, type="button", title="" }) => {
  const baseStyle = "px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-lg",
    secondary: "bg-transparent border border-zinc-700 text-white hover:border-white hover:bg-zinc-900",
    accent: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20",
    success: "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
  };

  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-colors duration-300 ${className}`}>
    {children}
  </div>
);

// --- Auth Screen (Refactored to use Firebase/Firestore) ---
const AuthScreen = ({ onAuthSubmit, onBack, maintenanceMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For Signup
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Call the Firebase-enabled handler passed from the main App component
    const { error: submitError } = await onAuthSubmit(isSignUp, email, password, name);
    
    setIsLoading(false);
    
    if (submitError) {
       setError(submitError);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] -z-10"></div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-12 h-12 bg-white text-black rounded-xl mb-4">
              <Cpu size={24} />
           </div>
           <h1 className="text-2xl font-bold tracking-tighter">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
           <p className="text-zinc-500 mt-2">{isSignUp ? 'Join WebFront AI today' : 'Sign in to your WebFront Dashboard'}</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {maintenanceMode && !isSignUp && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> Maintenance Mode Active
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20">{error}</div>}
            
            {isSignUp && (
              <div className="animate-fade-in">
                <label className="block text-sm text-zinc-400 mb-2 font-medium">Full Name / Company</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700"
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
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700"
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? <><Loader2 size={16} className="animate-spin mr-1"/> Processing...</> 
                : <><span className="mr-1">{isSignUp ? 'Create Account' : 'Sign In'}</span> <ArrowRight size={16} /></>}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-zinc-500">
            {isSignUp ? (
              <p>Already have an account? <button onClick={() => { setIsSignUp(false); setError(''); }} className="text-blue-400 hover:text-blue-300 font-medium ml-1">Log In</button></p>
            ) : (
              <div className="flex flex-col gap-2">
                <p>Don't have an account? <button onClick={() => { setIsSignUp(true); setError(''); }} className="text-blue-400 hover:text-blue-300 font-medium ml-1">Sign Up</button></p>
              </div>
            )}
          </div>
        </div>
        
        <button onClick={onBack} className="w-full mt-8 text-zinc-500 text-sm hover:text-white transition-colors flex items-center justify-center gap-2">
          ← Return to website
        </button>
      </div>
    </div>
  );
};

// --- AI Chat Widget (No changes) ---
const AIChatDemo = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello. I am WEBFRONT_AI. How can I assist your agency today?" }
  ]);
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

  // Helper function to process bold text
  const formatMessage = (text) => {
    if (!text) return null;
    // Split by **text** patterns
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove asterisks and wrap in strong tag
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
    1. **Keep your answers SHORT.** Maximum 2-3 sentences unless the user asks for a detailed breakdown.
    2. Use **bold** syntax (double asterisks) to highlight key terms (e.g., **pricing**, **services**).
    
    === FAQ: SIGN UP ===
    - If a user asks "How do I sign up?", tell them: "You can create an account immediately by clicking the **Login** button at the top and selecting **Sign Up**. However, we recommend a **Strategy Call** first for complex projects."
    
    === BRAND & POSITIONING ===
    - Tagline: "Elevate your digital reality."
    - We are a premium, modern digital agency specializing in **Custom Web Development** and **Autonomous AI Receptionists**.
    - Vibe: Futuristic, polished, minimal, conversion-focused.
    
    === CORE SERVICES ===
    1. **CUSTOM WEB DEVELOPMENT**:
       - Tech stack: Custom-coded **React & Next.js** (no cookie-cutter templates).
       - Focus: Speed, SEO, Conversion-focused UX, Smooth animations, Dark-mode optimized.
       - "We architect experiences, not just pages."
    
    2. **AI RECEPTIONISTS & AGENTS**:
       - Handle customer support, FAQs, bookings, and lead capture 24/7.
       - Natural language (chat/voice).
       - Trained on client data.
       - "An AI front desk that never sleeps."
    
    === PRICING OVERVIEW ===
    WEB DEVELOPMENT TIERS:
    - **Starter** ($2,500 one-time): Custom landing page, mobile responsive, basic SEO, 1 week support.
    - **Growth** ($4,500 one-time): Multi-page website, CMS integration, advanced animations, AI chatbot setup.
    - **Agency** ($8,000+ custom quote): Full web app, user auth, payments, deep AI integration.
    
    AI RECEPTIONISTS:
    - Starts around **$900/month**.
    - Price depends on channels, volume, and complexity.
    - "We'll give you a precise quote after a quick strategy call."
    
    === TONE ===
    - Tone: Professional, confident, slightly futuristic. Friendly but concise.
    - No slang or emojis unless the user uses them first.
    - Always ask qualifying questions (e.g., "What kind of business do you run?", "Do you have a timeline?").
    - Closing: Suggest booking a strategy call.
    - Never break character. You are an AI.`;

    const response = await callGemini(userMsg, systemPrompt);
    
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
      <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-sm text-zinc-400">WEBFRONT_AI</span>
        </div>
        <Sparkles size={18} className="text-blue-400" />
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
            }`}>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about pricing, services..."
          className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
        />
        <button 
          onClick={handleSend}
          className="bg-white text-black p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// --- Portal Views (CLIENT) ---

const ClientDashboardView = ({ data }) => {
  const totalOpenBalance = data.invoices?.reduce((acc, inv) => {
    if (inv.status !== 'Paid') {
      const val = parseFloat(inv.amount.replace(/[^0-9.-]+/g, ""));
      return acc + (isNaN(val) ? 0 : val);
    }
    return acc;
  }, 0) || 0;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalOpenBalance);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back, {data.name}</h1>
          <p className="text-zinc-500">Project: {data.project}</p>
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
          {data.name.charAt(0)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <h3 className="text-zinc-400 text-sm mb-1">Current Phase</h3>
          <p className="text-2xl font-bold truncate">{data.phase}</p>
          <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${data.progress}%` }}></div>
          </div>
          <p className="text-right text-xs text-blue-400 mt-1">{data.progress}% Complete</p>
        </Card>
        <Card>
          <h3 className="text-zinc-400 text-sm mb-1">Next Milestone</h3>
          <p className="text-2xl font-bold truncate">{data.milestone}</p>
          <p className="text-zinc-500 text-sm mt-2">Due: {data.dueDate}</p>
        </Card>
        <Card>
          <h3 className="text-zinc-400 text-sm mb-1">Open Invoices</h3>
          <p className="text-2xl font-bold">{formattedBalance}</p>
          <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
            {totalOpenBalance > 0
              ? <span className="text-yellow-500 flex items-center gap-1"><Activity size={14}/> Action Required</span> 
              : <><Check size={14}/> All paid</>}
          </p>
        </Card>
      </div>

      <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
        {data.activity && data.activity.length > 0 ? (
          data.activity.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="truncate max-w-[200px] sm:max-w-md">{item.action}</span>
              </div>
              <span className="text-zinc-500 text-sm whitespace-nowrap ml-4">{item.date}</span>
            </div>
          ))
        ) : (
          <div className="p-4 text-zinc-500 text-center">No recent activity</div>
        )}
      </div>
    </div>
  );
};

const ContractsView = ({ data }) => (
  <div className="animate-fade-in">
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-1">Documents & Contracts</h1>
      <p className="text-zinc-500">Access your legal agreements and project scopes.</p>
    </div>

    <div className="space-y-4">
      {data.contracts && data.contracts.length > 0 ? (
        data.contracts.map((doc, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-center justify-between hover:border-zinc-600 transition-all">
            <div className="flex items-center gap-4 min-w-0">
               <div className="w-12 h-12 bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-500">
                 <FileText size={24} />
               </div>
               <div className="min-w-0">
                 <h3 className="font-bold text-white truncate">{doc.name}</h3>
                 <p className="text-sm text-zinc-500">Uploaded on {doc.date} • {doc.size}</p>
               </div>
            </div>
            <button className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full flex-shrink-0">
              <Download size={20} />
            </button>
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-zinc-500 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">
          No documents available yet.
        </div>
      )}
    </div>
  </div>
);

const InvoicesView = ({ data }) => (
  <div className="animate-fade-in">
    <div className="mb-8 flex justify-between items-end">
      <div>
        <h1 className="text-3xl font-bold mb-1">Invoices</h1>
        <p className="text-zinc-500">View payment history and upcoming charges.</p>
      </div>
      <Button variant="secondary" className="px-4 py-2 text-xs">Download All CSV</Button>
    </div>

    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-4 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50">
        <div className="col-span-2">Description</div>
        <div>Date</div>
        <div className="text-right">Amount</div>
      </div>
      {data.invoices && data.invoices.length > 0 ? (
        data.invoices.map((inv, i) => (
          <div key={i} className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors items-center">
            <div className="col-span-2 min-w-0">
              <div className="font-bold truncate pr-4">{inv.desc}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                {inv.id} 
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                  inv.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {inv.status}
                </span>
              </div>
            </div>
            <div className="text-zinc-400 text-sm">{inv.date}</div>
            <div className="text-right font-mono">{inv.amount}</div>
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-zinc-500">No invoices found.</div>
      )}
    </div>
  </div>
);

const AIAssistantView = ({ data }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `I'm your dedicated Project Intelligence Agent. I have full context on your build (${data.progress}% complete). How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSend = async (text) => {
    const userText = text || input;
    if (!userText.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    const systemPrompt = `You are a dedicated AI Project Manager for a client named "${data.name}".
    Context:
    - Current Project Phase: ${data.phase} (${data.progress}% Complete)
    - Next Milestone: ${data.milestone} (Due ${data.dueDate})
    - Recent Activity: ${data.activity[0]?.action || "Project Started"}
    
    Goal: Assist the client by explaining technical terms, drafting internal emails for them to announce the project, or summarizing their status.
    Tone: Professional, assuring, and highly competent.`;

    const response = await callGemini(userText, systemPrompt);
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsTyping(false);
  };

  const quickActions = [
    "Draft an email to my team about the launch",
    "Explain what 'Database Schema' means",
    "Summarize my project status"
  ];

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          AI Project Assistant <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-600/50">BETA</span>
        </h1>
        <p className="text-zinc-500">Your intelligent guide for this project build.</p>
      </div>

      <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden mb-6">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
              }`}>
                {m.text.split('\n').map((line, j) => (
                  <p key={j} className={line ? "mb-2 last:mb-0" : "h-2"}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-zinc-800 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-zinc-400" />
                 <span className="text-zinc-400 text-sm">Analyzing project data...</span>
               </div>
             </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="px-6 pb-2 flex gap-2 flex-wrap">
            {quickActions.map((action, i) => (
              <button 
                key={i}
                onClick={() => handleSend(action)}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg border border-zinc-700 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything about your build..."
            className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ data, onUpdateClient, onDeleteAccount }) => {
  const [name, setName] = useState(data.name || "");
  const [notifications, setNotifications] = useState(data.notifications || { email: true, push: false });

  const handleSave = () => {
    onUpdateClient({ ...data, name, notifications });
  };

  const toggleNotification = (type) => {
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
  <div className="animate-fade-in">
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-1">Settings</h1>
      <p className="text-zinc-500">Manage your account preferences.</p>
    </div>

    <div className="grid gap-8 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2"><User size={18}/> Profile Details</h3>
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-medium text-zinc-500 mb-1">Company / Name</label>
             <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
             />
           </div>
           <div>
             <label className="block text-xs font-medium text-zinc-500 mb-1">Email (Locked)</label>
             <input type="text" value={data.email} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed" />
           </div>
        </div>
        <Button onClick={handleSave} className="text-sm py-2 px-4">Save Changes</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2"><Bell size={18}/> Notifications</h3>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
             <span className="text-sm text-zinc-300">Email Notifications</span>
             <div onClick={() => toggleNotification('email')} className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.email ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.email ? 'left-5' : 'left-1'}`}></div>
             </div>
          </div>
          <div className="flex items-center justify-between">
             <span className="text-sm text-zinc-300">Push Notifications</span>
             <div onClick={() => toggleNotification('push')} className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.push ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.push ? 'left-5' : 'left-1'}`}></div>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-800">
         <h3 className="text-lg font-bold flex items-center gap-2 text-red-500"><Shield size={18}/> Danger Zone</h3>
         <Button onClick={() => onDeleteAccount(data.id)} variant="danger" className="w-full justify-start">
           Delete My Account
         </Button>
      </div>
    </div>
  </div>
  );
};

const AdminFinancialsView = ({ clients }) => {
  const totalRevenue = clients.reduce((sum, client) => {
    if (!client.invoices) return sum;
    const clientPaid = client.invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((invSum, inv) => invSum + parseFloat(inv.amount.replace(/[^0-9.-]+/g, "")), 0);
    return sum + clientPaid;
  }, 0);

  const totalOutstanding = clients.reduce((sum, client) => {
    if (!client.invoices) return sum;
    const clientPending = client.invoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((invSum, inv) => invSum + parseFloat(inv.amount.replace(/[^0-9.-]+/g, "")), 0);
    return sum + clientPending;
  }, 0);

  const avgValue = clients.length > 0 ? (totalRevenue + totalOutstanding) / clients.length : 0;

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const allTransactions = clients.flatMap(client => 
    (client.invoices || []).map(inv => ({ ...inv, clientName: client.name }))
  );

  return (
  <div className="animate-fade-in">
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-1">Financials</h1>
      <p className="text-zinc-500">Revenue tracking based on active client deals.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <h3 className="text-zinc-400 text-sm mb-1">Total Revenue</h3>
        <p className="text-3xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p>
      </Card>
      <Card>
        <h3 className="text-zinc-400 text-sm mb-1">Outstanding</h3>
        <p className="text-3xl font-bold text-yellow-500">{formatCurrency(totalOutstanding)}</p>
      </Card>
      <Card>
        <h3 className="text-zinc-400 text-sm mb-1">Avg. Deal Value</h3>
        <p className="text-3xl font-bold text-blue-500">{formatCurrency(avgValue)}</p>
      </Card>
    </div>

    <h3 className="text-xl font-bold mb-6">All Transactions</h3>
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-4 p-4 border-b border-zinc-800 text-sm font-medium text-zinc-500 bg-zinc-900/50">
        <div>Client</div>
        <div>Date</div>
        <div>Invoice ID</div>
        <div className="text-right">Amount</div>
      </div>
      {allTransactions.map((t, i) => (
        <div key={i} className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/20 transition-colors">
          <div className="text-white font-medium truncate">{t.clientName}</div>
          <div className="text-zinc-500">{t.date}</div>
          <div className="text-zinc-500 font-mono text-xs pt-1">{t.id}</div>
          <div className={`text-right font-mono ${t.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{t.amount}</div>
        </div>
      ))}
      {allTransactions.length === 0 && <div className="p-4 text-center text-zinc-500">No transactions recorded.</div>}
    </div>
  </div>
  );
};

const AdminSettingsView = ({ settings, onUpdateSettings }) => {
  const [name, setName] = useState(settings.name);
  
  const handleSave = () => {
    onUpdateSettings({ ...settings, name });
  };

  const toggleMaintenance = () => {
    onUpdateSettings({ ...settings, maintenanceMode: !settings.maintenanceMode });
  };

  return (
  <div className="animate-fade-in">
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-1">Admin Settings</h1>
      <p className="text-zinc-500">System configuration and profile.</p>
    </div>

    <div className="max-w-2xl space-y-8">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Admin Profile</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
            <input type="text" defaultValue={settings.email} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed" />
          </div>
        </div>
        <Button onClick={handleSave} variant="secondary" className="text-sm py-2 px-4">Update Profile</Button>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">System Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
             <div className="flex flex-col">
                <span className="text-white font-bold flex items-center gap-2"><Power size={16}/> Maintenance Mode</span>
                <span className="text-xs text-zinc-400">Prevents all clients from logging in. Admin only.</span>
             </div>
             <div onClick={toggleMaintenance} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const AdminClientsManager = ({ clients, setClients }) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form States
  const [newClientData, setNewClientData] = useState({ name: '', email: '', project: '', phase: 'Discovery', progress: 0 });
  const [newInvoiceData, setNewInvoiceData] = useState({ desc: '', amount: '' });
  const [newContractName, setNewContractName] = useState('');

  const handleCreateClient = (e) => {
    e.preventDefault();
    // This function remains local mock creation for Admin UI demonstration.
    const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    const clientToAdd = {
      id: newId,
      ...newClientData,
      milestone: "Project Start",
      dueDate: "TBD",
      status: "Active",
      activity: [{ action: "Account Created", date: "Just now", status: "Completed" }],
      contracts: [],
      invoices: []
    };
    setClients([...clients, clientToAdd]);
    setIsAddingNew(false);
    setNewClientData({ name: '', email: '', project: '', phase: 'Discovery', progress: 0 });
  };

  const handleDeleteClient = (id) => {
    if (confirm("Are you sure you want to remove this client? This action cannot be undone.")) {
      const updatedClients = clients.filter(c => c.id !== id);
      setClients(updatedClients);
      setSelectedClient(null);
    }
  };

  const handleAddInvoice = () => {
    if(!newInvoiceData.amount || !newInvoiceData.desc) return;
    const invoice = {
      id: `INV-${Math.floor(Math.random() * 10000)}`,
      desc: newInvoiceData.desc,
      amount: `$${newInvoiceData.amount}`,
      date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
      status: "Pending"
    };
    selectedClient.invoices = [invoice, ...(selectedClient.invoices || [])];
    setClients([...clients]);
    setNewInvoiceData({ desc: '', amount: '' });
  };

  const handleMarkPaid = (invIndex) => {
    if (!selectedClient || !selectedClient.invoices) return;
    const updatedInvoices = [...selectedClient.invoices];
    updatedInvoices[invIndex] = { ...updatedInvoices[invIndex], status: "Paid" };
    selectedClient.invoices = updatedInvoices;
    setClients([...clients]);
  };

  const handleUploadContract = () => {
    if(!newContractName) return;
    const contract = {
      name: newContractName.endsWith('.pdf') ? newContractName : `${newContractName}.pdf`,
      date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
      size: "1.2 MB" // mock size
    };
    selectedClient.contracts = [contract, ...(selectedClient.contracts || [])];
    setClients([...clients]);
    setNewContractName('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in items-start">
      {/* List Column */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 h-[300px] lg:h-full flex-shrink-0">
        <Button variant="accent" className="w-full justify-center py-4 rounded-xl shadow-blue-900/30" onClick={() => { setIsAddingNew(true); setSelectedClient(null); }}>
          <Plus size={18} /> Add New Client
        </Button>
        
        <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-xl overflow-hidden overflow-y-auto">
          {clients.map(client => (
            <div 
              key={client.id}
              onClick={() => { setSelectedClient(client); setIsAddingNew(false); }}
              className={`p-5 border-b border-zinc-800/80 cursor-pointer transition-all duration-200 group ${selectedClient?.id === client.id ? 'bg-blue-900/10 border-l-4 border-l-blue-500 pl-4' : 'hover:bg-zinc-800/40 border-l-4 border-l-transparent hover:border-l-zinc-700'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-bold text-lg truncate ${selectedClient?.id === client.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{client.name}</span>
                <span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-400 px-2 py-1 rounded-full font-bold border border-green-500/20">Active</span>
              </div>
              <p className="text-sm text-zinc-500 mb-3 truncate group-hover:text-zinc-400">{client.project}</p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${client.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${client.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail/Edit Column */}
      <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 h-full w-full overflow-y-auto shadow-2xl relative">
        
        {/* CREATE MODE */}
        {isAddingNew && (
          <div className="animate-fade-in max-w-xl mx-auto mt-10">
             <div className="text-center mb-10">
               <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                 <Users size={32}/>
               </div>
               <h2 className="text-3xl font-bold text-white">Onboard New Client</h2>
               <p className="text-zinc-500 mt-2">Create a secure workspace for your new partner.</p>
             </div>
             
             <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Company Name</label>
                    <input required type="text" className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                      value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} placeholder="e.g. Acme Corp"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Client Email (Login ID)</label>
                    <input required type="email" className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                      value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} placeholder="client@acme.com"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Project Name</label>
                    <input required type="text" className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                      value={newClientData.project} onChange={e => setNewClientData({...newClientData, project: e.target.value})} placeholder="e.g. Website Redesign"/>
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <Button variant="secondary" className="flex-1 py-3" onClick={() => setIsAddingNew(false)}>Cancel</Button>
                  <Button type="submit" variant="success" className="flex-[2] py-3 font-bold">Create Client Account</Button>
                </div>
             </form>
          </div>
        )}

        {/* EDIT MODE */}
        {selectedClient && !isAddingNew && (
           <div className="animate-fade-in space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-zinc-800 pb-8 gap-4">
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate max-w-[200px] sm:max-w-[400px]">{selectedClient.name}</h2>
                      <button onClick={() => handleDeleteClient(selectedClient.id)} className="text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-zinc-800 rounded-lg" title="Delete Client">
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="text-zinc-400 flex items-center gap-2 text-sm"><Mail size={14}/> {selectedClient.email}</p>
                 </div>
                 <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white text-black flex flex-col items-center justify-center font-bold shadow-lg shadow-white/10 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedClient(null)}>
                      <span className="text-[10px] sm:text-xs">Save</span>
                      <Check size={16} className="sm:w-5 sm:h-5"/>
                    </div>
                 </div>
              </div>

              {/* Project Status Card */}
              <div className="bg-black/40 rounded-2xl border border-zinc-800/50 p-1">
                <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Briefcase size={16} className="text-purple-500"/> Project Status
                  </h3>
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block font-medium ml-1">Current Phase</label>
                      <div className="relative w-full">
                        <select 
                          value={selectedClient.phase}
                          onChange={(e) => {
                            selectedClient.phase = e.target.value; 
                            setClients([...clients]); 
                          }}
                          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500 transition-colors cursor-pointer text-sm pr-10 truncate"
                        >
                          <option>Discovery</option>
                          <option>Design</option>
                          <option>Development</option>
                          <option>Testing</option>
                          <option>Live</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16}/>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block font-medium ml-1 flex justify-between">
                        <span>Completion</span>
                        <span className="text-white font-bold">{selectedClient.progress}%</span>
                      </label>
                      <div className="h-12 flex items-center px-1">
                        <input 
                          type="range" min="0" max="100" 
                          value={selectedClient.progress}
                          onChange={(e) => {
                            selectedClient.progress = parseInt(e.target.value);
                            setClients([...clients]);
                          }}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Invoices Manager */}
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2 text-green-400"><DollarSign size={18}/> Invoices</h3>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{selectedClient.invoices?.length || 0} Total</span>
                  </div>
                  
                  <div className="flex-1 space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedClient.invoices?.map((inv, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-3 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                        <div className="min-w-0 pr-2">
                          <div className="text-white font-medium truncate">{inv.desc}</div>
                          <div className="text-zinc-600 text-xs">{inv.id} • {inv.date}</div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-mono text-zinc-300">{inv.amount}</div>
                            <span className={`text-[10px] font-bold ${inv.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{inv.status}</span>
                          </div>
                          {inv.status !== 'Paid' && (
                            <button 
                              onClick={() => handleMarkPaid(i)} 
                              className="bg-green-500/20 hover:bg-green-500/40 text-green-500 p-1.5 rounded-full transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!selectedClient.invoices || selectedClient.invoices.length === 0) && <div className="text-center py-8 text-zinc-600 text-sm border-2 border-dashed border-zinc-800/50 rounded-lg">No invoices sent yet.</div>}
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <div className="flex-1 space-y-2 min-w-0">
                        <input 
                          type="text" placeholder="Description" 
                          value={newInvoiceData.desc} onChange={e => setNewInvoiceData({...newInvoiceData, desc: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none truncate"
                        />
                        <div className="flex gap-2">
                          <input 
                            type="number" placeholder="$ Amount" 
                            value={newInvoiceData.amount} onChange={e => setNewInvoiceData({...newInvoiceData, amount: e.target.value})}
                            className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none min-w-0"
                          />
                          <Button variant="success" className="px-4 py-2" onClick={handleAddInvoice}><Send size={16}/></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contracts Manager */}
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2 text-blue-400"><FileText size={18}/> Contracts</h3>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{selectedClient.contracts?.length || 0} Files</span>
                  </div>

                  <div className="flex-1 space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedClient.contracts?.map((doc, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-3 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-blue-500/10 text-blue-500 p-2 rounded-lg flex-shrink-0">
                            <FileText size={16}/>
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate max-w-[150px]">{doc.name}</div>
                            <div className="text-zinc-600 text-xs">{doc.date} • {doc.size}</div>
                          </div>
                        </div>
                        <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><Download size={16}/></button>
                      </div>
                    ))}
                    {(!selectedClient.contracts || selectedClient.contracts.length === 0) && <div className="text-center py-8 text-zinc-600 text-sm border-2 border-dashed border-zinc-800/50 rounded-lg">No contracts uploaded.</div>}
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <div className="relative flex-1 min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UploadCloud size={14} className="text-zinc-500"/>
                        </div>
                        <input 
                          type="text" placeholder="Document Name" 
                          value={newContractName} onChange={e => setNewContractName(e.target.value)}
                          className="w-full bg-black border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-blue-500 outline-none truncate"
                        />
                      </div>
                      <Button variant="primary" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white border-0 flex-shrink-0" onClick={handleUploadContract}>Upload</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Activity Log Summary */}
              <div className="mt-8 pt-8 border-t border-zinc-800">
                 <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Latest Activity</h4>
                 <div className="space-y-1">
                    {selectedClient.activity.slice(0, 3).map((act, i) => (
                       <div key={i} className="flex gap-4 text-sm text-zinc-400 py-1">
                          <span className="w-24 text-zinc-600 text-xs py-0.5 flex-shrink-0">{act.date}</span>
                          <span className="text-white truncate">{act.action}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* EMPTY STATE */}
        {!selectedClient && !isAddingNew && (
           <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-6">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-inner">
                <Users size={48} className="opacity-50"/>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Select a Client</h3>
                <p className="max-w-xs mx-auto">Click on a client from the list on the left to manage their project, invoices, and contracts.</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

// --- Admin Portal Wrapper (No changes) ---
const AdminPortal = ({ onLogout, clients, setClients, adminSettings, setAdminSettings }) => {
  const [activeTab, setActiveTab] = useState('clients');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'financials', label: 'Financials', icon: CreditCard },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
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
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full`}>
        <h2 className="text-xl font-bold tracking-tighter mb-8 text-red-500 hidden lg:block">ADMIN<span className="text-white">_PANEL</span></h2>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-red-900/20 text-red-400 border border-red-900/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </div>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-2">
          Log Out <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'clients' && <AdminClientsManager clients={clients} setClients={setClients} />}
        {activeTab === 'financials' && <AdminFinancialsView clients={clients} />}
        {activeTab === 'settings' && <AdminSettingsView settings={adminSettings} onUpdateSettings={setAdminSettings} />}
      </div>
    </div>
  );
};

// --- Client Portal Wrapper (No changes) ---
const ClientPortal = ({ onLogout, clientData, onUpdateClient, onDeleteAccount }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, highlight: true },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <div className="font-bold">WEBFRONT_OS</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full`}>
        <h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">WEBFRONT<span className="text-blue-500">_OS</span></h2>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-zinc-800 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              } ${item.highlight ? 'border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20' : ''}`}
            >
              <item.icon size={18} className={item.highlight ? 'text-blue-400' : ''} /> 
              <span className={item.highlight ? 'text-blue-100 font-medium' : ''}>{item.label}</span>
            </div>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-2">
          Log Out <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        {activeTab === 'dashboard' && <ClientDashboardView data={clientData} />}
        {activeTab === 'ai-assistant' && <AIAssistantView data={clientData} />}
        {activeTab === 'contracts' && <ContractsView data={clientData} />}
        {activeTab === 'invoices' && <InvoicesView data={clientData} />}
        {activeTab === 'settings' && <SettingsView data={clientData} onUpdateClient={onUpdateClient} onDeleteAccount={onDeleteAccount} />}
      </div>
    </div>
  );
};

// --- Landing Page (No changes) ---
const LandingPage = ({ onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-zinc-800 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg">
              <Cpu size={20} />
            </div>
            WEBFRONT AI
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#demo" className="hover:text-white transition-colors">AI Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <button onClick={() => onLogin()} className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
              <LogIn size={14} /> Login
            </button>
            <Button variant="primary">Book Strategy Call</Button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 p-6 flex flex-col gap-4">
            <a href="#services" onClick={() => setIsMenuOpen(false)}>Services</a>
            <a href="#demo" onClick={() => setIsMenuOpen(false)}>AI Demo</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <button onClick={() => onLogin()} className="text-left">Login</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono mb-8 animate-fade-in-up">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            ACCEPTING NEW CLIENTS FOR Q4
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            ELEVATE YOUR <br />
            DIGITAL REALITY.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            WebFront AI builds high-performance websites and autonomous AI receptionists 
            that work while you sleep. The future isn't coming—it's hired.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 items-center">
            <Button variant="primary">Start Project</Button>
            <Button variant="secondary">View Portfolio</Button>
          </div>
        </div>
      </section>

      {/* The 4 Pillars Section */}
      <section className="py-12 border-y border-zinc-900 bg-zinc-950/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2">
                <Palette size={24} />
              </div>
              <h3 className="font-bold text-lg">Design</h3>
              <p className="text-sm text-zinc-500">Minimalist aesthetics that convert.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2">
                <Brain size={24} />
              </div>
              <h3 className="font-bold text-lg">Intelligence</h3>
              <p className="text-sm text-zinc-500">Autonomous agents trained on your data.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2">
                <Headphones size={24} />
              </div>
              <h3 className="font-bold text-lg">Support</h3>
              <p className="text-sm text-zinc-500">24/7 reliability for your customers.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-2">
                <TrendingUp size={24} />
              </div>
              <h3 className="font-bold text-lg">Growth</h3>
              <p className="text-sm text-zinc-500">Scalable architecture for the future.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">OUR SERVICES</h2>
            <div className="w-20 h-1 bg-blue-600"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="group cursor-pointer">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                <Code size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Web Development</h3>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Custom-coded React & Next.js applications designed for speed, SEO, and conversion. 
                We don't use templates; we architect experiences.
              </p>
              <ul className="space-y-2 text-zinc-500">
                <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> High-Performance Animations</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> CMS Integration</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Dark Mode Optimized</li>
              </ul>
            </Card>

            <Card className="group cursor-pointer">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI Receptionists</h3>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Intelligent agents that handle customer support, booking, and inquiries 24/7. 
                Train them on your data and let them run your front desk.
              </p>
              <ul className="space-y-2 text-zinc-500">
                <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Natural Language Processing</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Calendar Integration</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Voice & Chat Support</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-bold tracking-widest mb-6">
              LIVE PREVIEW
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              TALK TO THE <br /> 
              MACHINE.
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-md">
              Test our AI receptionist instantly. It can answer questions about our pricing, 
              services, and availability. No human required.
            </p>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-xs">U{i}</div>
                ))}
              </div>
              <p>Trusted by 50+ agencies</p>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center md:justify-end">
            <AIChatDemo />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">TRANSPARENT PRICING</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Starter', price: '$2,500', sub: 'One-time', features: ['Custom Landing Page', 'Mobile Responsive', 'Basic SEO', '1 Week Support'] },
              { title: 'Growth', price: '$4,500', sub: 'One-time', features: ['Multi-page Website', 'CMS Integration', 'Advanced Animations', 'AI Chatbot Setup'] },
              { title: 'Agency', price: '$8,000+', sub: 'Custom Quote', features: ['Full Web App', 'User Authentication', 'Payment Integration', 'Custom AI Training'] }
            ].map((tier, index) => (
              <Card key={index} className={`relative flex flex-col ${index === 1 ? 'border-blue-600 bg-zinc-900' : 'bg-transparent'}`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{tier.title}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-zinc-500 text-sm">{tier.sub}</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check size={14} className="text-blue-500 flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Button variant={index === 1 ? 'accent' : 'secondary'} className="w-full">Get Started</Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 text-center md:text-left">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold tracking-tighter">WEBFRONT AI</div>
          <div className="text-zinc-500 text-sm">
            © 2024 WebFront AI. Built for the future.
          </div>
          <div className="flex gap-6 text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Main App Controller ---
export default function App() {
  const [view, setView] = useState('landing'); 
  const [userRole, setUserRole] = useState('client'); 
  // We keep INITIAL_CLIENTS for the Admin UI mock data persistence
  const [clients, setClients] = useState(INITIAL_CLIENTS); 
  const [currentClientData, setCurrentClientData] = useState(null); 
  
  // Admin Settings State (Centralized)
  const [adminSettings, setAdminSettings] = useState({
    name: "Admin User",
    email: "aapsantos07@gmail.com",
    maintenanceMode: false
  });

  const handleLogin = (role, clientData) => {
    setUserRole(role);
    if (role === 'admin') {
      setView('admin');
    } else {
      setCurrentClientData(clientData); 
      setView('portal');
    }
  };

  // Centralized Client Update Handler (simulating DB update)
  const handleClientUpdate = (updatedClient) => {
    // This now simulates updating data after a successful login/auth
    const updatedClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updatedClients);
    setCurrentClientData(updatedClient); // Update local view immediately
  };

  // Centralized Client Deletion Handler
  const handleClientDelete = (id) => {
    // NOTE: In a real app, you would use a modal instead of confirm().
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      // NOTE: In a real app, you would also delete the user from Firebase Auth here.
      const updatedClients = clients.filter(c => c.id !== id);
      setClients(updatedClients);
      setView('landing'); // Force logout
    }
  };

  // --- REFACTORED: Unified Authentication Handler using Firebase Auth and Firestore ---
  const handleAuthSubmit = async (isSignUp, email, password, name) => {
    
    // 1. Admin Check (Kept as hardcoded local bypass for admin access)
    if (email.toLowerCase() === 'aapsantos07@gmail.com' && password === 'Andre121.') {
        handleLogin('admin', null);
        return { error: null };
    }

    if (adminSettings.maintenanceMode && isSignUp) {
        return { error: "New signups are disabled during maintenance." };
    }

    try {
        if (isSignUp) {
            // SIGN UP: Use Firebase Auth and Firestore for persistence
            
            // 1. Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // 2. Prepare client data object
            const clientData = {
                id: user.uid, // Use Firebase UID as the unique key
                name: name,
                email: email,
                project: "New Project",
                phase: "Discovery",
                progress: 0,
                milestone: "Onboarding",
                dueDate: "TBD",
                revenue: 0,
                status: "Active",
                activity: [{ action: "Account Created", date: new Date().toLocaleDateString(), status: "Completed" }],
                invoices: [],
                contracts: [],
                notifications: { email: true, push: false }
            };
            
            // 3. Save structured client data to Firestore
            // Collection: 'clients', Document ID: user.uid
            await setDoc(doc(db, "clients", user.uid), clientData);
            
            // 4. Update local state (for Admin View mock data) and log in
            setClients(prev => [...prev, clientData]); 
            handleLogin('client', clientData);
            
        } else {
            // LOGIN: Use Firebase Auth and Firestore to retrieve user data
            
            // 1. Sign in via Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            
            // 2. Fetch structured data from Firestore
            const clientDocSnap = await getDoc(doc(db, "clients", uid));
            
            if (clientDocSnap.exists()) {
                handleLogin('client', clientDocSnap.data());
            } else {
                // If the Auth record exists but the Firestore document does not, log out
                await signOut(auth); 
                return { error: "User data not found in database. Please contact support." };
            }
        }
        return { error: null }; // Success
    } catch (firebaseError) {
        // Handle Firebase-specific errors
        console.error("Firebase Auth Error:", firebaseError.code, firebaseError.message);

        if (firebaseError.code === 'auth/email-already-in-use') {
            return { error: "This email is already in use. Try logging in." };
        }
        if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
             return { error: "Invalid login credentials." };
        }
        return { error: `An authentication error occurred: ${firebaseError.message}.` };
    }
  };
  // --------------------------------------------------------------------------------

  return (
    <>
      {view === 'landing' && <LandingPage onLogin={() => setView('auth')} />}
      
      {view === 'auth' && (
        // --- UPDATED PROP: Pass unified handler ---
        <AuthScreen 
          onAuthSubmit={handleAuthSubmit} // New handler for all auth
          onBack={() => setView('landing')} 
          maintenanceMode={adminSettings.maintenanceMode} 
        />
      )}
      
      {view === 'portal' && currentClientData && (
        <ClientPortal 
          onLogout={() => setView('landing')} 
          clientData={currentClientData}
          onUpdateClient={handleClientUpdate}
          onDeleteAccount={handleClientDelete}
        />
      )}
      
      {view === 'admin' && (
        <AdminPortal 
          onLogout={() => setView('landing')} 
          clients={clients} 
          setClients={setClients}
          adminSettings={adminSettings}
          setAdminSettings={setAdminSettings}
        />
      )}
    </>
  );
}