import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, User, CheckCircle, ArrowRight, Menu, X, 
  Code, PenTool, Video, Music, Shield, Rocket, Loader2,
  Instagram, Twitter, Linkedin, LogOut, PlusCircle,
  LayoutDashboard, FileText, Search, Bell, ChevronRight, 
  Star, Send, Mail, MessageSquare, ThumbsUp, ThumbsDown, 
  UserCircle, Trash2, Settings, Filter, Save, CreditCard,
  UploadCloud, Moon, Sun, BookOpen, Lock, Unlock, Sparkles,
  Award, Eye, EyeOff, Paperclip, Receipt, Trophy, Zap, Check
} from 'lucide-react';

// --- Import Services ---
import { auth } from './firebase'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { supabase } from './supabase'; 

// --- UTILS ---
const COLORS = {
  primary: "from-indigo-600 to-violet-600",
  secondary: "from-emerald-500 to-teal-500",
};

const CATEGORIES = [
  { 
    id: 'dev', 
    name: "Web Development", 
    description: "Learn React, HTML, and CSS basics.",
    icon: <Code size={24} />, 
    color: "text-blue-500", 
    bg: "bg-blue-50 dark:bg-blue-900/20", 
    borderColor: "border-blue-200 dark:border-blue-800",
    xp: 500
  },
  { 
    id: 'design', 
    name: "Creative Design", 
    description: "Master color theory and layout.",
    icon: <PenTool size={24} />, 
    color: "text-purple-500", 
    bg: "bg-purple-50 dark:bg-purple-900/20", 
    borderColor: "border-purple-200 dark:border-purple-800",
    xp: 450
  },
  { 
    id: 'video', 
    name: "Video & Animation", 
    description: "Editing cuts, transitions & formats.",
    icon: <Video size={24} />, 
    color: "text-red-500", 
    bg: "bg-red-50 dark:bg-red-900/20", 
    borderColor: "border-red-200 dark:border-red-800",
    xp: 400
  },
  { 
    id: 'music', 
    name: "Music & Audio", 
    description: "Bitrates, mixing and sound design.",
    icon: <Music size={24} />, 
    color: "text-green-500", 
    bg: "bg-green-50 dark:bg-green-900/20", 
    borderColor: "border-green-200 dark:border-green-800",
    xp: 300
  },
];

const QUIZZES = {
  'dev': { question: "Which of these is a JavaScript Library?", options: ["Laravel", "React", "Django", "Flask"], answer: "React" },
  'design': { question: "What does RGB stand for?", options: ["Red Green Blue", "Real Great Background", "Red Gold Black"], answer: "Red Green Blue" },
  'video': { question: "Which format is standard for web video?", options: ["MP4", "PSD", "DOCX", "EXE"], answer: "MP4" },
  'music': { question: "What is a common audio bitrate?", options: ["320 kbps", "1080p", "4K", "RGB"], answer: "320 kbps" }
};

// --- UI COMPONENTS ---
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in border-l-4 ${type === 'error' ? 'bg-white dark:bg-gray-800 border-red-500 text-red-600 dark:text-red-400' : 'bg-white dark:bg-gray-800 border-emerald-500 text-emerald-600 dark:text-emerald-400'}`}>
    {type === 'error' ? <X size={18} /> : <CheckCircle size={18} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X size={14}/></button>
  </div>
);

const Button = ({ children, variant = 'primary', className = '', onClick, disabled, icon: Icon }) => {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 dark:shadow-none",
    secondary: "bg-white text-indigo-600 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-gray-700 dark:text-indigo-400 dark:hover:bg-gray-700",
    outline: "bg-transparent border border-gray-300 text-gray-600 hover:border-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border-transparent dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none",
    payment: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-200 dark:shadow-none",
    ai: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`relative px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {disabled ? <Loader2 size={18} className="animate-spin"/> : Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", ...props }) => (
  <div className="group">
    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    {type === 'textarea' ? (
      <textarea className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none transition-all resize-none min-h-[100px]" {...props}/>
    ) : type === 'select' ? (
      <div className="relative">
        <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none appearance-none" {...props}>
          {props.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><ChevronRight size={16} className="rotate-90"/></div>
      </div>
    ) : (
      <input type={type} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none" {...props}/>
    )}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800">
      <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400"><X size={20}/></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// --- CHAT SYSTEM ---
const ChatSystem = ({ currentUser, activeChat, setActiveChat, parentMode }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order('created_at', { ascending: false });
      if (!data) return;
      const uniqueUsers = {};
      data.forEach(msg => {
        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        if (!uniqueUsers[otherId]) {
          uniqueUsers[otherId] = { id: otherId, name: activeChat?.id === otherId ? activeChat.name : "User", lastMsg: msg.content };
        }
      });
      setContacts(Object.values(uniqueUsers));
    };
    fetchContacts();
  }, [currentUser, activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`).order('created_at', { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat, currentUser]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || parentMode) return;
    const { error } = await supabase.from('messages').insert([{ sender_id: currentUser.id, receiver_id: activeChat.id, content: input }]);
    if (!error) { setMessages([...messages, { sender_id: currentUser.id, content: input, created_at: new Date().toISOString() }]); setInput(''); }
  };

  return (
    <div className="h-[600px] flex bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="w-1/3 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-300">Messages</div>
        {contacts.map(c => (
          <div key={c.id} onClick={() => setActiveChat(c)} className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-white dark:hover:bg-gray-800 ${activeChat?.id === c.id ? 'bg-white dark:bg-gray-800 border-l-4 border-indigo-600' : ''}`}>
             <div className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{c.name}</div>
             <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastMsg}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shadow-sm z-10">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserCircle className="text-gray-400"/> {activeChat.name}</h3>
              {parentMode && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1"><Eye size={12}/> Parent View</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-950">
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === currentUser.id;
                return <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>{msg.content}</div></div>;
              })}
              <div ref={scrollRef}></div>
            </div>
            <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input disabled={parentMode} value={input} onChange={(e) => setInput(e.target.value)} placeholder={parentMode ? "Chat disabled in Parent Mode" : "Type a message..."} className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-950 border focus:border-indigo-200 dark:text-white rounded-xl px-4 py-2 focus:outline-none transition-all disabled:opacity-50" />
              {!parentMode && <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700"><Send size={18} /></button>}
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col"><MessageSquare size={48} className="mb-4 opacity-20" /><p>Select a conversation</p></div>
        )}
      </div>
    </div>
  );
};

// --- LANDING PAGE ---
const LandingPage = ({ setView, onFeedback, darkMode, toggleTheme }) => (
  <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors duration-300">
    <nav className="fixed w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-2xl text-gray-900 dark:text-white">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS.primary} flex items-center justify-center text-white shadow-lg`}><Rocket size={20} /></div>
          TeenVerse
        </div>
        <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Button variant="primary" onClick={() => setView('auth')}>Get Started</Button>
        </div>
      </div>
    </nav>
    <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
       <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase mb-8 border border-indigo-100 dark:border-indigo-800"><Star size={12} className="fill-indigo-600 dark:fill-indigo-400"/> The #1 Platform for Teen Freelancers</div>
       <h1 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Turn your <span className="text-indigo-600 dark:text-indigo-400">Passion</span><br/> into <span className="text-emerald-500">Paychecks.</span></h1>
       <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">TeenVerse is the safest ecosystem for teens to build a portfolio, find vetted clients, and earn money securely.</p>
       <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="success" className="h-14 px-8 text-lg" icon={Search} onClick={() => setView('auth')}>Find Work Now</Button>
          <Button variant="secondary" className="h-14 px-8 text-lg" icon={PlusCircle} onClick={() => setView('auth')}>Post a Job</Button>
       </div>
    </section>
    {/* About Us */}
    <section className="bg-gray-50 dark:bg-gray-900 py-20 px-6">
      <div className="max-w-7xl mx-auto">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">About Us</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">We are building the future of work for the next generation.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-indigo-600 dark:text-indigo-400 mb-2">For Teens</h3><p className="text-gray-600 dark:text-gray-300">Gain financial independence, build real-world skills, and start your career early.</p></div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-purple-600 dark:text-purple-400 mb-2">For Parents</h3><p className="text-gray-600 dark:text-gray-300">A safe, monitored environment where your child can learn the value of work.</p></div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-emerald-600 dark:text-emerald-400 mb-2">For Clients</h3><p className="text-gray-600 dark:text-gray-300">Tap into the digital-native generation for fresh ideas and modern skills.</p></div>
         </div>
         <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Explore Opportunities</h2>
         <div className="grid md:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer group">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color} group-hover:scale-110 transition-transform`}>{cat.icon}</div>
                 <h3 className="font-bold text-gray-900 dark:text-white mb-1">{cat.name}</h3>
                 <p className="text-sm text-gray-400">{cat.count}</p>
              </div>
            ))}
         </div>
      </div>
    </section>
    
    {/* Feedback Section */}
    <section className="py-20 px-6 bg-white dark:bg-gray-950">
       <div className="max-w-3xl mx-auto bg-indigo-900 rounded-3xl p-10 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">We Value Your Feedback</h2>
            <p className="text-indigo-200 mb-8">Help us make TeenVerse better for everyone.</p>
            <form onSubmit={onFeedback} className="max-w-md mx-auto space-y-4 text-left">
               <input name="name" placeholder="Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
               <input name="email" placeholder="Email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
               <textarea name="message" placeholder="Message..." className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none min-h-[100px]" required></textarea>
               <button className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2 text-gray-900">Send Feedback <Send size={18}/></button>
            </form>
          </div>
       </div>
    </section>

    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-8">
       <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"><div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white"><Rocket size={12}/></div>TeenVerse</div>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium"><button className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy</button><button className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms</button><button className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</button></div>
          <div className="flex gap-4"><Instagram size={18} className="text-gray-400 hover:text-pink-600 cursor-pointer"/><Twitter size={18} className="text-gray-400 hover:text-blue-400 cursor-pointer"/><Linkedin size={18} className="text-gray-400 hover:text-blue-700 cursor-pointer"/></div>
       </div>
       <div className="text-center text-xs text-gray-400 mt-8">© 2025 TeenVerse Inc.</div>
    </footer>
  </div>
);

const Auth = ({ setView, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('freelancer');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [resume, setResume] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.get('email'), form.get('password'));
        onLogin('Welcome back!');
      } else {
        const cred = await createUserWithEmailAndPassword(auth, form.get('email'), form.get('password'));
        
        let fileUrl = "";
        if (file) {
          const fileName = `id_${cred.user.uid}_${Date.now()}`;
          await supabase.storage.from('id_proofs').upload(fileName, file);
          fileUrl = supabase.storage.from('id_proofs').getPublicUrl(fileName).data.publicUrl;
        }

        let resumeUrl = "";
        if (role === 'freelancer' && resume) {
          const resumeName = `resume_${cred.user.uid}_${Date.now()}`;
          await supabase.storage.from('resumes').upload(resumeName, resume);
          resumeUrl = supabase.storage.from('resumes').getPublicUrl(resumeName).data.publicUrl;
        }

        const table = role === 'client' ? 'clients' : 'freelancers';
        const data = role === 'client' 
           ? { 
               id: cred.user.uid, 
               name: form.get('name'), 
               email: form.get('email'), 
               phone: form.get('phone'), 
               nationality: form.get('nationality'), 
               id_proof_url: fileUrl, 
               is_organisation: form.get('org') 
             }
           : { 
               id: cred.user.uid, 
               name: form.get('name'), 
               email: form.get('email'), 
               phone: form.get('phone'), 
               nationality: form.get('nationality'), 
               id_proof_url: fileUrl, 
               age: form.get('age'), 
               gender: form.get('gender'), 
               upi: form.get('upi'),
               qualification: form.get('qualification'),
               specialty: form.get('specialty'),
               services: form.get('services'),
               resume_url: resumeUrl,
               unlocked_skills: []
             };
        await supabase.from(table).insert([data]);
        onLogin('Account created!');
      }
    } catch (err) { alert(err.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 overflow-y-auto max-h-[90vh]">
         <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-gray-900 dark:text-white">{isLogin ? 'Welcome' : 'Join Us'}</h2><button onClick={() => setView('home')} className="dark:text-gray-400"><X/></button></div>
         {!isLogin && <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6"><button onClick={() => setRole('freelancer')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'freelancer' ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Freelancer</button><button onClick={() => setRole('client')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'client' ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Client</button></div>}
         <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <Input name="name" label="Name" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input name="phone" label="Phone" required />
                  <Input name="nationality" label="Country" required />
                </div>
                {role === 'freelancer' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input name="age" label="Age" />
                      <Input name="gender" label="Gender" type="select" options={["Male", "Female"]} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <Input name="qualification" label="Grade/Qualification" placeholder="e.g. 10th Grade" />
                       <Input name="specialty" label="Main Skill" placeholder="e.g. Video Editing" />
                    </div>
                    <Input name="services" label="Services Offered" placeholder="e.g. Python, Logo Design (Comma separated)" />
                    <Input name="upi" label="UPI ID" />
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Upload Resume / CV</label>
                      <label className="flex items-center gap-3 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                        <Paperclip size={20} className="text-orange-500" /><span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">{resume ? resume.name : "Attach Resume (PDF)..."}</span>
                        <input type="file" onChange={(e) => setResume(e.target.files[0])} className="hidden" accept=".pdf,.doc,.docx" />
                      </label>
                    </div>
                  </>
                ) : (
                  <Input name="org" label="Org?" type="select" options={["No", "Yes"]} />
                )}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{role === 'freelancer' ? "Upload ID Proof" : "Upload Org ID"}</label>
                  <label className="flex items-center gap-3 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group-focus-within:ring-2 group-focus-within:ring-indigo-500">
                    <UploadCloud size={20} className="text-indigo-500" /><span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">{file ? file.name : "Click to upload..."}</span>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" required />
                  </label>
                </div>
              </>
            )}
            <Input name="email" label="Email" required />
            <Input name="password" label="Password" type="password" required />
            <Button className="w-full mt-6" disabled={loading}>{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}</Button>
         </form>
         <div className="mt-6 text-center text-sm"><button onClick={() => setIsLogin(!isLogin)} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{isLogin ? 'Create Account' : 'Log In'}</button></div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme }) => {
  const isClient = user.type === 'client';
  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false); 
  const [modal, setModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const lastNotificationId = useRef(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [profileForm, setProfileForm] = useState({ ...user });

  // --- PAYMENT CONFIRMATION MODAL STATE ---
  const [paymentModal, setPaymentModal] = useState(null); // { appId, amount, freelancerId }

  // --- NEW FEATURES STATE ---
  const [parentMode, setParentMode] = useState(false);
  const [unlockedSkills, setUnlockedSkills] = useState(user.unlockedSkills || []);
  const [badges, setBadges] = useState(user.badges || ['Verified']);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [rawPortfolioText, setRawPortfolioText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // --- QUIZ STATE ---
  const [quizState, setQuizState] = useState({ selected: null, status: 'idle' }); // 'idle', 'correct', 'incorrect'

  useEffect(() => {
    const fetchData = async () => {
      let appsData = [];
      if (isClient) {
        const { data: myJobs } = await supabase.from('jobs').select('*').eq('client_id', user.id).order('created_at', {ascending: false});
        setJobs(myJobs || []);
        const { data: apps } = await supabase.from('applications').select('*').eq('client_id', user.id);
        appsData = apps || [];
      } else {
        const { data: allJobs } = await supabase.from('jobs').select('*').order('created_at', {ascending: false});
        setJobs(allJobs || []);
        const { data: myApps } = await supabase.from('applications').select('*').eq('freelancer_id', user.id);
        appsData = myApps || [];
      }
      setApplications(appsData);
      const total = appsData.reduce((acc, curr) => {
        if (curr.status === 'Paid') {
          const amount = Number(curr.bid_amount) || 0;
          return isClient ? acc + amount : acc + (amount * 0.96);
        }
        return acc;
      }, 0);
      setTotalEarnings(total);
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {ascending: false});
      if (notifs && notifs.length > 0) {
        const latest = notifs[0];
        if (lastNotificationId.current && latest.id !== lastNotificationId.current) {
          showToast(latest.message, 'success');
        }
        lastNotificationId.current = latest.id;
      }
      setNotifications(notifs || []);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [user, modal, isClient]); 

  const handleClearNotifications = async () => {
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
    if (error) showToast(error.message, 'error'); else setNotifications([]);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" ? true : job.job_type === filterType;
    return matchesSearch && matchesType;
  });

  const handlePostJob = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jobData = { client_id: user.id, client_name: user.name, title: formData.get('title'), budget: formData.get('budget'), job_type: formData.get('type'), duration: formData.get('duration'), tags: formData.get('tags'), description: formData.get('description'), category: formData.get('category') || 'dev' };
    const { error } = await supabase.from('jobs').insert([jobData]);
    if (error) showToast(error.message, 'error'); else { showToast('Job Posted!'); setModal(null); }
  };

  const handleApplyJob = async (e) => {
    e.preventDefault();
    if (parentMode) { showToast("Parent Mode Active: Cannot apply.", "error"); return; }
    
    if (!isClient && selectedJob) {
      const jobCategory = selectedJob.category || 'dev';
      if (!unlockedSkills.includes(jobCategory)) {
        showToast(`Locked! Pass the ${jobCategory} quiz in Academy first.`, "error");
        setModal('quiz-locked');
        return;
      }
    }

    if (applications.some(app => app.job_id === selectedJob.id)) { showToast("Already applied!", "error"); return; }
    const formData = new FormData(e.target);
    const appData = { job_id: selectedJob.id, freelancer_id: user.id, freelancer_name: user.name, client_id: selectedJob.client_id, cover_letter: formData.get('cover_letter'), bid_amount: formData.get('bid_amount') };
    const { error } = await supabase.from('applications').insert([appData]);
    await supabase.from('notifications').insert([{ user_id: selectedJob.client_id, message: `New application: ${selectedJob.title}` }]);
    if (error) showToast(error.message, 'error'); else { showToast('Applied successfully!'); setModal(null); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const tableName = isClient ? 'clients' : 'freelancers';
    const updates = { ...profileForm };
    delete updates.type; 
    const { error } = await supabase.from(tableName).update(updates).eq('id', user.id);
    if (error) showToast(error.message, 'error'); else { showToast("Profile updated!"); setUser(profileForm); }
  };

  const initiatePayment = (appId, amount, freelancerId) => {
    if (parentMode) return;
    setPaymentModal({ appId, amount, freelancerId });
  };

  const processPayment = async () => {
    const { appId, amount, freelancerId } = paymentModal;
    const totalAmount = parseFloat(amount);
    const platformFee = (totalAmount * 0.04).toFixed(2);
    const netAmount = (totalAmount - platformFee).toFixed(2);

    await supabase.from('applications').update({ status: 'Paid' }).eq('id', appId);
    await supabase.from('notifications').insert([{ user_id: freelancerId, message: `Payment received! ₹${netAmount} credited (₹${platformFee} platform fee deducted).` }]);
    
    showToast(`Payment successful!`);
    setApplications(applications.map(a => a.id === appId ? { ...a, status: 'Paid' } : a));
    setPaymentModal(null); 
  };

  // --- ENHANCED QUIZ HANDLER ---
  const handleQuizSelection = async (categoryId, answer) => {
    const correctAnswer = QUIZZES[categoryId].answer;
    setQuizState({ selected: answer, status: answer === correctAnswer ? 'correct' : 'incorrect' });

    if (answer === correctAnswer) {
      // Wait 1.5s to show green success state, then unlock
      setTimeout(async () => {
        const newSkills = [...unlockedSkills, categoryId];
        setUnlockedSkills(newSkills);
        
        // Add XP and Badge logic visually (mockup)
        setBadges([...badges, 'Skill Unlocked']);
        
        await supabase.from('freelancers').update({ unlocked_skills: newSkills }).eq('id', user.id);
        setUser({ ...user, unlockedSkills: newSkills });

        setModal(null); // Close quiz
        setQuizState({ selected: null, status: 'idle' });
        showToast("🎉 Skill Unlocked! +500 XP", "success");
      }, 1500);
    } else {
      // Reset after 1s if wrong
      setTimeout(() => {
        setQuizState({ selected: null, status: 'idle' });
        showToast("Incorrect. Try again!", "error");
      }, 1000);
    }
  };

  const handleAiGenerate = () => {
    if (!rawPortfolioText) return;
    setIsAiLoading(true);
    setTimeout(() => {
      const newItem = { id: Date.now(), title: "Professional Case Study", content: `Project Overview: ${rawPortfolioText}. \n\nOutcome: Successfully delivered a high-quality solution demonstrating core competencies in problem-solving and technical execution.` };
      setPortfolioItems([newItem, ...portfolioItems]);
      setRawPortfolioText("");
      setIsAiLoading(false);
      showToast("AI Magic Applied!");
    }, 1500);
  };

  const updateStatus = async (appId, status, freelancerId) => {
    await supabase.from('applications').update({ status }).eq('id', appId);
    let msg = `Application ${status} by client.`;
    if(status === 'Accepted') msg = `Application Accepted! You can start working.`;
    await supabase.from('notifications').insert([{ user_id: freelancerId, message: msg }]);
    showToast(`Marked as ${status}`);
    setApplications(applications.map(a => a.id === appId ? { ...a, status } : a));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200`}>
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900 dark:text-white"><div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${COLORS.primary} flex items-center justify-center text-white`}><Rocket size={16} /></div>TeenVerse</div>
          <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400"><X/></button>
        </div>
        <div className="p-4 space-y-1">
           <button onClick={() => {setTab('overview'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'overview' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><LayoutDashboard size={18}/> Dashboard</button>
           <button onClick={() => {setTab('jobs'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'jobs' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Briefcase size={18}/> {isClient ? 'My Jobs' : 'Find Work'}</button>
           <button onClick={() => {setTab('applications'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'applications' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><FileText size={18}/> {isClient ? 'Applicants' : 'My Applications'}</button>
           <button onClick={() => {setTab('messages'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'messages' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><MessageSquare size={18}/> Messages</button>
           {!isClient && (
             <>
               <button onClick={() => {setTab('academy'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'academy' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><BookOpen size={18}/> Academy</button>
               <button onClick={() => {setTab('portfolio'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'portfolio' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Sparkles size={18}/> Portfolio AI</button>
             </>
           )}
           <button onClick={() => {setTab('settings'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Settings size={18}/> Settings</button>
        </div>
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">{user.name[0]}</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate dark:text-gray-200 flex items-center gap-1">{user.name} {badges.length > 0 && <Award size={12} className="text-yellow-500"/>}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.type}</p>
              </div>
           </div>
           <Button variant="outline" className="w-full justify-start text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 border-gray-200 dark:border-gray-700" icon={LogOut} onClick={onLogout}>Sign Out</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen relative">
         {parentMode && <div className="bg-amber-500 text-white text-center text-xs font-bold py-1 sticky top-0 z-50">PARENT MODE ACTIVE - READ ONLY</div>}
         <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-white"><Menu/></button>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{tab}</h2>
            </div>
            <div className="flex items-center gap-4 relative">
               {isClient && !parentMode && <Button variant="primary" icon={PlusCircle} onClick={() => setModal('post-job')}>Post Job</Button>}
               <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
               <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full relative transition-colors"><Bell size={20}/>{notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}</button>
                  {showNotifications && (
                     <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fade-in">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50"><h3 className="font-bold text-gray-700 dark:text-gray-200">Notifications</h3>{notifications.length > 0 && <button onClick={handleClearNotifications} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Clear All</button>}</div>
                        <div className="max-h-[300px] overflow-y-auto">{notifications.length === 0 ? <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">No new notifications</div> : notifications.map(n => <div key={n.id} className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-300">{n.message}<div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.created_at).toLocaleTimeString()}</div></div>)}</div>
                     </div>
                  )}
               </div>
            </div>
         </header>

         <div className="p-8 max-w-6xl mx-auto">
            {tab === 'overview' && (
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                 <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl"><p className="text-indigo-100 mb-2">Total {isClient ? 'Spent' : 'Earnings'}</p><h3 className="text-4xl font-bold">₹{totalEarnings.toFixed(2)}</h3></div>
                 <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm"><p className="text-gray-500 dark:text-gray-400 mb-2">{isClient ? 'Active Jobs' : 'Jobs Applied'}</p><h3 className="text-3xl font-bold dark:text-white">{isClient ? jobs.length : applications.length}</h3></div>
                 <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm"><p className="text-gray-500 dark:text-gray-400 mb-2">Badges Earned</p><div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"><Award size={20}/> {badges.length}</div></div>
              </div>
            )}

            {/* --- IMPROVED ACADEMY UI --- */}
            {tab === 'academy' && !isClient && (
               <div className="space-y-8 animate-fade-in">
                  {/* Gamified Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                     <div className="relative z-10 flex justify-between items-end">
                        <div>
                           <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Trophy size={32} className="text-yellow-300"/> Level {Math.floor(unlockedSkills.length / 2) + 1} Freelancer</h2>
                           <p className="text-indigo-100">Complete quizzes to unlock new job categories and earn badges!</p>
                        </div>
                        <div className="text-right hidden sm:block">
                           <div className="text-4xl font-black">{unlockedSkills.length * 500} <span className="text-lg font-normal opacity-70">XP</span></div>
                           <div className="text-sm opacity-80">{unlockedSkills.length} / 4 Skills Mastered</div>
                        </div>
                     </div>
                     {/* Progress Bar */}
                     <div className="mt-6 h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-yellow-400 transition-all duration-1000 ease-out" style={{ width: `${(unlockedSkills.length / 4) * 100}%` }}></div>
                     </div>
                  </div>

                  {/* Skill Cards Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                     {CATEGORIES.map((cat) => {
                       const isUnlocked = unlockedSkills.includes(cat.id);
                       return (
                         <div 
                           key={cat.id} 
                           className={`relative bg-white dark:bg-gray-900 p-6 rounded-2xl border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl
                             ${isUnlocked 
                               ? 'border-emerald-200 dark:border-emerald-900/50 shadow-emerald-100 dark:shadow-none' 
                               : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900'
                             }`}
                         >
                            {/* Status Badge */}
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 
                                ${isUnlocked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                {isUnlocked ? <><Check size={12}/> Mastered</> : <><Lock size={12}/> Locked</>}
                            </div>

                            <div className="flex items-start gap-4 mb-6">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                  {cat.icon}
                               </div>
                               <div>
                                  <h3 className="font-bold text-lg dark:text-white">{cat.name}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{cat.description}</p>
                               </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                               <div className="text-xs font-bold text-gray-400 flex items-center gap-1"><Zap size={14} className="fill-yellow-400 text-yellow-400"/> +{cat.xp} XP</div>
                               <Button 
                                 variant={isUnlocked ? "success" : "primary"} 
                                 onClick={() => !isUnlocked && setModal(`quiz-${cat.id}`)} 
                                 disabled={isUnlocked}
                                 className={`h-10 px-6 text-xs ${isUnlocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none' : ''}`}
                               >
                                  {isUnlocked ? "Unlocked" : "Start Quiz"}
                               </Button>
                            </div>
                         </div>
                       )
                     })}
                  </div>
               </div>
            )}

            {tab === 'portfolio' && !isClient && (
               <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-3xl text-white shadow-lg">
                     <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Sparkles/> AI Portfolio Builder</h2>
                     <p className="text-pink-100 mb-6">Turn your messy notes into a professional case study instantly.</p>
                     <textarea value={rawPortfolioText} onChange={(e) => setRawPortfolioText(e.target.value)} placeholder="E.g., I made a poster for my school play using Canva..." className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-pink-200 focus:outline-none min-h-[100px] mb-4"/>
                     <Button variant="secondary" className="w-full border-none text-rose-600" onClick={handleAiGenerate} disabled={isAiLoading}>{isAiLoading ? "Generating Magic..." : "Generate Professional Case Study"}</Button>
                  </div>
                  <div className="space-y-4">
                     <h3 className="font-bold text-gray-900 dark:text-white">Your Portfolio</h3>
                     {portfolioItems.length === 0 && <p className="text-gray-400 text-sm">No items yet. Use the AI tool above.</p>}
                     {portfolioItems.map(item => (
                        <div key={item.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                           <h4 className="font-bold dark:text-white mb-2">{item.title}</h4>
                           <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{item.content}</p>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {tab === 'jobs' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                     <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800 px-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Search size={18} className="text-gray-400" />
                        <input placeholder="Search jobs..." className="w-full bg-transparent border-none py-3 px-3 focus:outline-none text-sm dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                     </div>
                  </div>
                  <div className="grid gap-6">
                     {filteredJobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-indigo-100 dark:hover:border-indigo-900 transition-all relative">
                           <div className="flex justify-between items-start mb-4 pr-10">
                              <div><h3 className="font-bold text-lg dark:text-white">{job.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{job.client_name}</p></div>
                              <span className="font-black text-lg bg-gray-50 dark:bg-gray-800 dark:text-white px-3 py-1 rounded-lg">{job.budget}</span>
                           </div>
                           <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{job.description}</p>
                           <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-4">
                              {!isClient && !parentMode && (
                                 <Button className="py-2 px-4 text-xs" onClick={() => {
                                    setSelectedJob(job); 
                                    if(unlockedSkills.includes(job.category)) setModal('apply-job');
                                    else showToast("Skill Locked! Go to Academy.", "error");
                                 }}>Apply</Button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {tab === 'applications' && (
               <div className="space-y-4 animate-fade-in">
                  {applications.map(app => {
                     const linkedJob = jobs.find(j => j.id === app.job_id);
                     return (
                     <div key={app.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                        <div className="flex-1">
                           <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                              {isClient ? app.freelancer_name : (linkedJob ? linkedJob.client_name : `Job #${app.job_id}`)}
                           </h4>
                           {!isClient && linkedJob && (
                               <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                   Applied for: <span className="font-medium text-gray-700 dark:text-gray-300">{linkedJob.title}</span>
                               </p>
                           )}
                           <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1 items-center">
                               <span>Bid: <strong className="text-gray-900 dark:text-gray-200">₹{app.bid_amount}</strong></span>
                               <span className={`px-2 rounded text-xs font-bold uppercase ${app.status === 'Accepted' ? 'bg-yellow-100 text-yellow-700' : app.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-700'}`}>{app.status}</span>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" className="shrink-0" icon={MessageSquare} onClick={() => {setActiveChat({ id: isClient ? app.freelancer_id : app.client_id, name: isClient ? app.freelancer_name : 'Client' }); setTab('messages');}}>Chat</Button>
                           {isClient && app.status === 'Pending' && !parentMode && <><Button variant="success" icon={ThumbsUp} onClick={() => { if(!parentMode) updateStatus(app.id, 'Accepted', app.freelancer_id)}}>Accept</Button></>}
                           {/* NEW: Changed to open Custom Modal */}
                           {isClient && app.status === 'Accepted' && !parentMode && (
                              <Button variant="payment" icon={CreditCard} onClick={() => initiatePayment(app.id, app.bid_amount, app.freelancer_id)}>Pay Now</Button>
                           )}
                        </div>
                     </div>
                  )})}
               </div>
            )}

            {tab === 'messages' && <ChatSystem currentUser={user} activeChat={activeChat} setActiveChat={setActiveChat} parentMode={parentMode} />}

            {tab === 'settings' && (
               <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg animate-fade-in">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Settings className="text-indigo-600 dark:text-indigo-400" /> Settings</h2>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
                     <div><h3 className="font-bold dark:text-white">Parent Co-Pilot Mode</h3><p className="text-xs text-gray-500">Read-only view for safety.</p></div>
                     <button onClick={() => setParentMode(!parentMode)} className={`p-2 rounded-lg font-bold text-xs ${parentMode ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{parentMode ? "Active" : "Inactive"}</button>
                  </div>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                     <Input label="Full Name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                        <Input label="Nationality" value={profileForm.nationality} onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} />
                     </div>

                     {!isClient && (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                              <Input label="Age" value={profileForm.age} onChange={e => setProfileForm({...profileForm, age: e.target.value})} />
                              <Input label="Qualification" value={profileForm.qualification} onChange={e => setProfileForm({...profileForm, qualification: e.target.value})} />
                           </div>
                           <Input label="Specialty" value={profileForm.specialty} onChange={e => setProfileForm({...profileForm, specialty: e.target.value})} />
                           <Input label="Services Offered" value={profileForm.services} onChange={e => setProfileForm({...profileForm, services: e.target.value})} />
                           <Input label="UPI ID" value={profileForm.upi} onChange={e => setProfileForm({...profileForm, upi: e.target.value})} />
                        </>
                     )}

                     <div className="pt-4">
                        <Button className="w-full" icon={Save} disabled={parentMode}>Save Changes</Button>
                     </div>
                  </form>
               </div>
            )}
         </div>
      </main>

      {modal === 'post-job' && (
        <Modal title="Post Job" onClose={() => setModal(null)}>
          <form onSubmit={handlePostJob} className="space-y-4">
            <Input name="title" label="Title" required />
            <div className="grid grid-cols-2 gap-4"><Input name="budget" label="Budget" required /><Input name="duration" label="Duration" required /></div>
            <Input name="type" label="Type" type="select" options={["Fixed", "Hourly"]} />
            <Input name="category" label="Category" type="select" options={["dev", "design", "video", "music"]} />
            <Input name="tags" label="Tags" />
            <Input name="description" label="Description" type="textarea" required />
            <Button className="w-full">Post Job</Button>
          </form>
        </Modal>
      )}
      {modal === 'apply-job' && (
        <Modal title={`Apply for ${selectedJob?.title}`} onClose={() => setModal(null)}>
          <form onSubmit={handleApplyJob} className="space-y-4">
             <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-indigo-700 dark:text-indigo-300 text-sm mb-2">Client Budget: <strong>{selectedJob?.budget}</strong></div>
             <Input name="bid_amount" label="Your Bid Amount (₹)" required />
             <Input name="cover_letter" label="Cover Letter" type="textarea" placeholder="Why are you the best fit?" required />
             <Button className="w-full" variant="success">Submit Application</Button>
          </form>
        </Modal>
      )}
      {/* --- ENHANCED QUIZ MODAL --- */}
      {modal?.startsWith('quiz-') && (
        <Modal title="Skill Assessment" onClose={() => {setModal(null); setQuizState({selected: null, status: 'idle'})}}>
           <div className="space-y-6">
              {/* Progress Header */}
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded dark:bg-indigo-900 dark:text-indigo-300">Question 1/1</span>
                 <span className="text-xs text-gray-400">Win +500 XP</span>
              </div>

              {/* Question */}
              <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {QUIZZES[modal.replace('quiz-', '')]?.question}
                 </h3>
                 
                 <div className="space-y-3">
                    {QUIZZES[modal.replace('quiz-', '')]?.options.map(opt => {
                       const isSelected = quizState.selected === opt;
                       const isCorrect = quizState.status === 'correct';
                       const isWrong = quizState.status === 'incorrect';
                       
                       let btnClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500";
                       
                       if (isSelected) {
                          if (isCorrect) btnClass = "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-white";
                          else if (isWrong) btnClass = "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-white";
                       }

                       return (
                          <button 
                             key={opt} 
                             onClick={() => handleQuizSelection(modal.replace('quiz-', ''), opt)} 
                             className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all flex justify-between items-center ${btnClass}`}
                             disabled={quizState.status !== 'idle'}
                          >
                             {opt}
                             {isSelected && isCorrect && <CheckCircle className="text-emerald-500"/>}
                             {isSelected && isWrong && <X className="text-red-500"/>}
                          </button>
                       )
                    })}
                 </div>
              </div>
           </div>
        </Modal>
      )}
      {modal === 'quiz-locked' && (
         <Modal title="Category Locked" onClose={() => setModal(null)}>
            <div className="text-center py-6">
               <Lock size={48} className="mx-auto text-gray-300 mb-4"/>
               <h3 className="text-xl font-bold dark:text-white mb-2">Skill Verification Required</h3>
               <p className="text-gray-500 mb-6">You need to pass the assessment for this category in the <strong>Academy</strong> tab before applying.</p>
               <Button onClick={() => {setTab('academy'); setModal(null);}}>Go to Academy</Button>
            </div>
         </Modal>
      )}

      {/* --- NEW PAYMENT CONFIRMATION MODAL --- */}
      {paymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 transition-all border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white text-center">
                    <CreditCard size={48} className="mx-auto mb-2 opacity-80"/>
                    <h2 className="text-2xl font-bold">Confirm Payment</h2>
                    <p className="opacity-90 text-sm">Secure Transaction • TeenVerse SafePay</p>
                </div>
                
                {/* Body */}
                <div className="p-8 space-y-4">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                        <span>Service Cost</span>
                        <span>₹{paymentModal.amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                        <span>Platform Fee (4%)</span>
                        <span className="text-red-500">- ₹{(paymentModal.amount * 0.04).toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white">
                        <span>Total Pay</span>
                        <span>₹{paymentModal.amount}</span>
                    </div>
                    
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-center mt-4">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            Freelancer receives: <span className="font-bold text-sm">₹{(paymentModal.amount * 0.96).toFixed(2)}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button 
                            onClick={() => setPaymentModal(null)} 
                            className="py-3 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={processPayment} 
                            className="py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-200 hover:shadow-fuchsia-300 transition-all flex items-center justify-center gap-2"
                        >
                            <Receipt size={16} /> Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

// --- MAIN APP ---
export default function TeenVerse() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        let { data: c } = await supabase.from('clients').select('*').eq('id', u.uid).single();
        if (c) { setUser({ ...c, type: 'client' }); setView('dashboard'); }
        else {
          let { data: f } = await supabase.from('freelancers').select('*').eq('id', u.uid).single();
          // FIX: Load unlockedSkills from DB
          if (f) { setUser({ ...f, type: 'freelancer', unlockedSkills: f.unlocked_skills || [] }); setView('dashboard'); }
        }
        showToast('Logged in successfully');
      } else { setUser(null); }
    });
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);
  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };
  const handleFeedback = async (e) => { e.preventDefault(); const formData = new FormData(e.target); await supabase.from('feedback').insert([{ name: formData.get('name'), email: formData.get('email'), message: formData.get('message') }]); showToast('Feedback sent!'); e.target.reset(); };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {view === 'home' && <LandingPage setView={setView} onFeedback={handleFeedback} darkMode={darkMode} toggleTheme={toggleTheme} />}
      {view === 'auth' && <Auth setView={setView} onLogin={(msg) => showToast(msg)} />}
      {view === 'dashboard' && user && <Dashboard user={user} setUser={setUser} onLogout={async () => { await signOut(auth); setView('home'); showToast('Logged out successfully'); }} showToast={showToast} darkMode={darkMode} toggleTheme={toggleTheme} />}
    </>
  );
}