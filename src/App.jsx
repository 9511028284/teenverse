import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, User, CheckCircle, ArrowRight, Menu, X, 
  Code, PenTool, Video, Music, Shield, Rocket, Loader2,
  Instagram, Twitter, Linkedin, LogOut, PlusCircle,
  LayoutDashboard, FileText, Search, Bell, ChevronRight, 
  Star, Send, Mail, MessageSquare, ThumbsUp, ThumbsDown, 
  UserCircle, Trash2, Settings, Filter, Save, CreditCard,
  UploadCloud, BellRing
} from 'lucide-react';

// --- Import Services ---
// Make sure these files exist in your project
import { auth } from './firebase'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { supabase } from './supabase'; 

// --- UTILS ---
const COLORS = {
  primary: "from-indigo-600 to-violet-600",
  secondary: "from-emerald-500 to-teal-500",
};

const CATEGORIES = [
  { name: "Development", icon: <Code size={20} />, color: "bg-blue-50 text-blue-600", count: "120+ Jobs" },
  { name: "Creative Design", icon: <PenTool size={20} />, color: "bg-purple-50 text-purple-600", count: "85+ Jobs" },
  { name: "Video & Animation", icon: <Video size={20} />, color: "bg-red-50 text-red-600", count: "50+ Jobs" },
  { name: "Music & Audio", icon: <Music size={20} />, color: "bg-green-50 text-green-600", count: "30+ Jobs" },
];

// --- UI COMPONENTS ---
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in border-l-4 ${type === 'error' ? 'bg-white border-red-500 text-red-600' : 'bg-white border-emerald-500 text-emerald-600'}`}>
    {type === 'error' ? <X size={18} /> : <CheckCircle size={18} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X size={14}/></button>
  </div>
);

const Button = ({ children, variant = 'primary', className = '', onClick, disabled, icon: Icon }) => {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300",
    secondary: "bg-white text-indigo-600 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50",
    outline: "bg-transparent border border-gray-300 text-gray-600 hover:border-gray-800",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border-transparent",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200",
    payment: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-200"
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
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    {type === 'textarea' ? (
      <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[100px]" {...props}/>
    ) : type === 'select' ? (
      <div className="relative">
        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" {...props}>
          {props.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><ChevronRight size={16} className="rotate-90"/></div>
      </div>
    ) : (
      <input type={type} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" {...props}/>
    )}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// --- CHAT SYSTEM ---
const ChatSystem = ({ currentUser, activeChat, setActiveChat }) => {
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
    if (!input.trim()) return;
    const { error } = await supabase.from('messages').insert([{ sender_id: currentUser.id, receiver_id: activeChat.id, content: input }]);
    if (!error) { setMessages([...messages, { sender_id: currentUser.id, content: input, created_at: new Date().toISOString() }]); setInput(''); }
  };

  return (
    <div className="h-[600px] flex bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="w-1/3 border-r border-gray-100 bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 font-bold text-gray-700">Messages</div>
        {contacts.map(c => (
          <div key={c.id} onClick={() => setActiveChat(c)} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white ${activeChat?.id === c.id ? 'bg-white border-l-4 border-indigo-600' : ''}`}>
             <div className="font-bold text-sm text-gray-900 truncate">{c.name}</div>
             <div className="text-xs text-gray-500 truncate">{c.lastMsg}</div>
          </div>
        ))}
        {contacts.length === 0 && <div className="p-4 text-xs text-gray-400">No conversations yet.</div>}
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><UserCircle className="text-gray-400"/> {activeChat.name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === currentUser.id;
                return <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>{msg.content}</div></div>;
              })}
              <div ref={scrollRef}></div>
            </div>
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-100 border-transparent focus:bg-white border focus:border-indigo-200 rounded-xl px-4 py-2 focus:outline-none transition-all" />
              <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700"><Send size={18} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col"><MessageSquare size={48} className="mb-4 opacity-20" /><p>Select a conversation</p></div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const LandingPage = ({ setView, onFeedback }) => (
  <div className="bg-white">
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-2xl text-gray-900">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS.primary} flex items-center justify-center text-white shadow-lg`}><Rocket size={20} /></div>
          TeenVerse
        </div>
        <Button variant="primary" onClick={() => setView('auth')}>Get Started</Button>
      </div>
    </nav>

    <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
       <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase mb-8 border border-indigo-100"><Star size={12} className="fill-indigo-600"/> The #1 Platform for Teen Freelancers</div>
       <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight">Turn your <span className="text-indigo-600">Passion</span><br/> into <span className="text-emerald-500">Paychecks.</span></h1>
       <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">TeenVerse is the safest ecosystem for teens to build a portfolio, find vetted clients, and earn money securely.</p>
       <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="success" className="h-14 px-8 text-lg" icon={Search} onClick={() => setView('auth')}>Find Work Now</Button>
          <Button variant="secondary" className="h-14 px-8 text-lg" icon={PlusCircle} onClick={() => setView('auth')}>Post a Job</Button>
       </div>
    </section>

    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">About Us</h2>
            <p className="text-gray-500 mt-2">We are building the future of work for the next generation.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-indigo-600 mb-2">For Teens</h3><p className="text-gray-600">Gain financial independence, build real-world skills, and start your career early.</p></div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-purple-600 mb-2">For Parents</h3><p className="text-gray-600">A safe, monitored environment where your child can learn the value of work.</p></div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-emerald-600 mb-2">For Clients</h3><p className="text-gray-600">Tap into the digital-native generation for fresh ideas and modern skills.</p></div>
         </div>

         <h2 className="text-2xl font-bold text-center mb-8">Explore Opportunities</h2>
         <div className="grid md:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all cursor-pointer group">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color} group-hover:scale-110 transition-transform`}>{cat.icon}</div>
                 <h3 className="font-bold text-gray-900 mb-1">{cat.name}</h3>
                 <p className="text-sm text-gray-400">{cat.count}</p>
              </div>
            ))}
         </div>
      </div>
    </section>

    <section className="py-20 px-6 bg-white">
       <div className="max-w-3xl mx-auto bg-indigo-900 rounded-3xl p-10 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">We Value Your Feedback</h2>
            <p className="text-indigo-200 mb-8">Help us make TeenVerse better for everyone.</p>
            <form onSubmit={onFeedback} className="max-w-md mx-auto space-y-4 text-left">
               <input name="name" placeholder="Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
               <input name="email" placeholder="Email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
               <textarea name="message" placeholder="Message..." className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none min-h-[100px]" required></textarea>
               <button className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2">Send Feedback <Send size={18}/></button>
            </form>
          </div>
       </div>
    </section>

    <footer className="bg-white border-t border-gray-100 py-8">
       <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900"><div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white"><Rocket size={12}/></div>TeenVerse</div>
          <div className="flex gap-6 text-sm text-gray-500 font-medium"><button className="hover:text-indigo-600">Privacy</button><button className="hover:text-indigo-600">Terms</button><button className="hover:text-indigo-600">Contact</button></div>
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
          const fileName = `${cred.user.uid}-${Date.now()}`;
          await supabase.storage.from('id_proofs').upload(fileName, file);
          fileUrl = supabase.storage.from('id_proofs').getPublicUrl(fileName).data.publicUrl;
        }
        const table = role === 'client' ? 'clients' : 'freelancers';
        const data = role === 'client' 
           ? { id: cred.user.uid, name: form.get('name'), email: form.get('email'), phone: form.get('phone'), nationality: form.get('nationality'), id_proof_url: fileUrl, is_organisation: form.get('org'), project_duration: form.get('duration') }
           : { id: cred.user.uid, name: form.get('name'), email: form.get('email'), phone: form.get('phone'), nationality: form.get('nationality'), id_proof_url: fileUrl, age: form.get('age'), gender: form.get('gender'), hourly_rate: form.get('rate'), upi: form.get('upi') };
        await supabase.from(table).insert([data]);
        onLogin('Account created!');
      }
    } catch (err) { alert(err.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-8">
         <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-gray-900">{isLogin ? 'Welcome' : 'Join Us'}</h2><button onClick={() => setView('home')}><X/></button></div>
         {!isLogin && <div className="flex bg-gray-100 p-1 rounded-xl mb-6"><button onClick={() => setRole('freelancer')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'freelancer' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Freelancer</button><button onClick={() => setRole('client')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'client' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Client</button></div>}
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
                    <Input name="upi" label="UPI ID" />
                  </>
                ) : (
                  <Input name="org" label="Org?" type="select" options={["No", "Yes"]} />
                )}
                
                {/* File Upload */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    {role === 'freelancer' ? "Upload ID Proof (e.g., Student ID)" : "Upload Organization ID / Business Proof"}
                  </label>
                  <label className="flex items-center gap-3 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 transition-all group-focus-within:ring-2 group-focus-within:ring-indigo-500">
                    <UploadCloud size={20} className="text-indigo-500" />
                    <span className="text-sm text-gray-500 flex-1 truncate">
                      {file ? file.name : "Click to upload file..."}
                    </span>
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files[0])} 
                      className="hidden" 
                      required
                    />
                  </label>
                </div>
              </>
            )}
            <Input name="email" label="Email" required />
            <Input name="password" label="Password" type="password" required />
            <Button className="w-full mt-6" disabled={loading}>{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}</Button>
         </form>
         <div className="mt-6 text-center text-sm"><button onClick={() => setIsLogin(!isLogin)} className="font-bold text-indigo-600 hover:underline">{isLogin ? 'Create Account' : 'Log In'}</button></div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, setUser, onLogout, showToast }) => {
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
  
  // NEW: Track last notification to trigger Toasts
  const lastNotificationId = useRef(null);

  // State to store calculated total earnings/spent
  const [totalEarnings, setTotalEarnings] = useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Profile Form State
  const [profileForm, setProfileForm] = useState({ ...user });

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

      // Calculate total earnings/spent ONLY when status is 'Paid'
      const total = appsData.reduce((acc, curr) => {
        if (curr.status === 'Paid') {
          const amount = Number(curr.bid_amount) || 0;
          if (isClient) {
             return acc + amount;
          } else {
             return acc + (amount * 0.96);
          }
        }
        return acc;
      }, 0);
      setTotalEarnings(total);

      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {ascending: false});
      
      // FIX: Check if there's a new notification to show a Toast
      if (notifs && notifs.length > 0) {
        const latest = notifs[0];
        if (lastNotificationId.current && latest.id !== lastNotificationId.current) {
          // Only show toast if it's a new notification coming in while user is on the dashboard
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
    if (error) showToast(error.message, 'error');
    else {
      setNotifications([]);
      setShowNotifications(false);
      showToast('Notifications cleared');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" ? true : job.job_type === filterType;
    return matchesSearch && matchesType;
  });

  const handlePostJob = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jobData = { client_id: user.id, client_name: user.name, title: formData.get('title'), budget: formData.get('budget'), job_type: formData.get('type'), duration: formData.get('duration'), tags: formData.get('tags'), description: formData.get('description') };
    const { error } = await supabase.from('jobs').insert([jobData]);
    if (error) showToast(error.message, 'error'); else { showToast('Job Posted!'); setModal(null); }
  };

  const handleApplyJob = async (e) => {
    e.preventDefault();
    if (applications.some(app => app.job_id === selectedJob.id)) { showToast("Already applied!", "error"); return; }
    const formData = new FormData(e.target);
    const appData = { 
        job_id: selectedJob.id, freelancer_id: user.id, freelancer_name: user.name, 
        client_id: selectedJob.client_id, cover_letter: formData.get('cover_letter'), bid_amount: formData.get('bid_amount') 
    };
    const { error } = await supabase.from('applications').insert([appData]);
    await supabase.from('notifications').insert([{ user_id: selectedJob.client_id, message: `New application: ${selectedJob.title}` }]);
    if (error) showToast(error.message, 'error'); else { showToast('Applied successfully!'); setModal(null); }
  };

  const handleDeleteJob = async (jobId) => {
    if(!window.confirm("Are you sure you want to delete this job?")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if(error) showToast(error.message, 'error');
    else { 
      setJobs(jobs.filter(j => j.id !== jobId)); 
      showToast("Job deleted"); 
    }
  };

  const handleWithdrawApplication = async (appId) => {
    if(!window.confirm("Withdraw this application?")) return;
    const { error } = await supabase.from('applications').delete().eq('id', appId);
    if(error) showToast(error.message, 'error');
    else {
      setApplications(applications.filter(a => a.id !== appId));
      showToast("Application withdrawn");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const tableName = isClient ? 'clients' : 'freelancers';
    const updates = { ...profileForm };
    delete updates.type; 

    const { error } = await supabase.from(tableName).update(updates).eq('id', user.id);
    
    if (error) { 
      showToast(error.message, 'error'); 
    } else { 
      showToast("Profile updated successfully!"); 
      setUser(profileForm); 
    }
  };

  const handlePayment = async (appId, amount, freelancerId) => {
    const totalAmount = parseFloat(amount);
    const platformFee = (totalAmount * 0.04).toFixed(2); 
    const netAmount = (totalAmount - platformFee).toFixed(2); 

    const confirmMessage = `
      Confirm Payment Details:
      ------------------------
      Total Amount: ₹${totalAmount}
      Platform Fee (4%): -₹${platformFee}
      ------------------------
      Net to Freelancer: ₹${netAmount}
      
      Proceed with payment?
    `;

    if(!window.confirm(confirmMessage)) return;

    await supabase.from('applications').update({ status: 'Paid' }).eq('id', appId);
    
    // FIX: Send detailed notification that will trigger the Toast on freelancer's side
    await supabase.from('notifications').insert([{ 
      user_id: freelancerId, 
      message: `Payment received! ₹${netAmount} credited (₹${platformFee} platform fee deducted).` 
    }]);
    
    showToast(`Payment successful!`);
    setApplications(applications.map(a => a.id === appId ? { ...a, status: 'Paid' } : a));
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200`}>
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900"><div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${COLORS.primary} flex items-center justify-center text-white`}><Rocket size={16} /></div>TeenVerse</div>
          <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400"><X/></button>
        </div>
        <div className="p-4 space-y-1">
           <button onClick={() => {setTab('overview'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><LayoutDashboard size={18}/> Dashboard</button>
           <button onClick={() => {setTab('jobs'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'jobs' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><Briefcase size={18}/> {isClient ? 'My Jobs' : 'Find Work'}</button>
           <button onClick={() => {setTab('applications'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'applications' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><FileText size={18}/> {isClient ? 'Applicants' : 'My Applications'}</button>
           <button onClick={() => {setTab('messages'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'messages' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><MessageSquare size={18}/> Messages</button>
           <button onClick={() => {setTab('settings'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${tab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><Settings size={18}/> Settings</button>
        </div>
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-100">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{user.name[0]}</div>
              <div className="overflow-hidden"><p className="text-sm font-bold truncate">{user.name}</p><p className="text-xs text-gray-500 capitalize">{user.type}</p></div>
           </div>
           <Button variant="outline" className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 border-gray-200" icon={LogOut} onClick={onLogout}>Sign Out</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
         <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg"><Menu/></button>
               <h2 className="text-xl font-bold text-gray-800 capitalize">{tab}</h2>
            </div>
            <div className="flex items-center gap-4 relative">
               {isClient && <Button variant="primary" icon={PlusCircle} onClick={() => setModal('post-job')}>Post Job</Button>}
               
               {/* Interactive Notification Bell */}
               <div className="relative">
                  <button 
                     onClick={() => setShowNotifications(!showNotifications)} 
                     className="p-2 text-gray-400 hover:text-gray-600 rounded-full relative transition-colors"
                  >
                     <Bell size={20}/>
                     {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                  </button>
                  
                  {/* Dropdown */}
                  {showNotifications && (
                     <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                           <h3 className="font-bold text-gray-700">Notifications</h3>
                           {notifications.length > 0 && (
                              <button onClick={handleClearNotifications} className="text-xs text-indigo-600 hover:underline font-medium">Clear All</button>
                           )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                           {notifications.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                           ) : (
                              notifications.map(n => (
                                 <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm text-gray-600">
                                    {n.message}
                                    <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleTimeString()}</div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </header>

         <div className="p-8 max-w-6xl mx-auto">
            {tab === 'overview' && (
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                 {/* Display the calculated total earnings instead of static text */}
                 <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl"><p className="text-indigo-100 mb-2">Total {isClient ? 'Spent' : 'Earnings'}</p><h3 className="text-4xl font-bold">₹{totalEarnings.toFixed(2)}</h3></div>
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"><p className="text-gray-500 mb-2">{isClient ? 'Active Jobs' : 'Jobs Applied'}</p><h3 className="text-3xl font-bold">{isClient ? jobs.length : applications.length}</h3></div>
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"><p className="text-gray-500 mb-2">Status</p><div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle size={20}/> Verified</div></div>
              </div>
            )}

            {tab === 'jobs' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                     <div className="flex-1 flex items-center bg-gray-50 px-4 rounded-xl border border-gray-200">
                        <Search size={18} className="text-gray-400" />
                        <input 
                           placeholder="Search jobs by title or keyword..." 
                           className="w-full bg-transparent border-none py-3 px-3 focus:outline-none text-sm"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-500" />
                        <select 
                           className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                           value={filterType}
                           onChange={(e) => setFilterType(e.target.value)}
                        >
                           <option value="All">All Types</option>
                           <option value="Hourly">Hourly</option>
                           <option value="Fixed">Fixed Price</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid gap-6">
                     {filteredJobs.length === 0 ? <div className="text-center py-20 text-gray-500">No jobs found.</div> : filteredJobs.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-all relative group">
                           {isClient && job.client_id === user.id && (
                              <button onClick={() => handleDeleteJob(job.id)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                 <Trash2 size={18} />
                              </button>
                           )}
                           
                           <div className="flex justify-between items-start mb-4 pr-10">
                              <div><h3 className="font-bold text-lg">{job.title}</h3><p className="text-sm text-gray-500">{job.client_name}</p></div>
                              <span className="font-black text-lg bg-gray-50 px-3 py-1 rounded-lg">{job.budget}</span>
                           </div>
                           <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                           <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                              <div className="flex gap-2">{job.tags?.split(',').map((t,i) => <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded font-medium">{t}</span>)}</div>
                              {!isClient && <Button className="py-2 px-4 text-xs" onClick={() => {setSelectedJob(job); setModal('apply-job');}}>Apply</Button>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {tab === 'applications' && (
               <div className="space-y-4 animate-fade-in">
                  {applications.length === 0 ? <div className="text-center py-20 text-gray-500">No applications found.</div> : applications.map(app => (
                     <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                        <div className="flex-1">
                           <h4 className="font-bold text-gray-900 text-lg">{isClient ? app.freelancer_name : `Job #${app.job_id}`}</h4>
                           <div className="flex gap-3 text-sm text-gray-500 mt-1 items-center">
                               <span>Bid: <strong className="text-gray-900">₹{app.bid_amount}</strong></span>
                               <span>•</span>
                               <span className={`px-2 rounded text-xs font-bold uppercase 
                                  ${app.status === 'Accepted' ? 'bg-yellow-100 text-yellow-700' : 
                                    app.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                    app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {app.status}
                               </span>
                           </div>
                           {isClient && <p className="mt-2 text-xs bg-gray-50 p-2 rounded italic text-gray-600">"{app.cover_letter}"</p>}
                        </div>
                        
                        <div className="flex gap-2">
                           <Button variant="outline" className="shrink-0" icon={MessageSquare} onClick={() => {
                             setActiveChat({ id: isClient ? app.freelancer_id : app.client_id, name: isClient ? app.freelancer_name : 'Client' });
                             setTab('messages');
                           }}>Chat</Button>

                           {!isClient && app.status === 'Pending' && (
                              <Button variant="danger" className="shrink-0" icon={Trash2} onClick={() => handleWithdrawApplication(app.id)}>Withdraw</Button>
                           )}

                           {isClient && app.status === 'Pending' && (
                             <>
                               <Button variant="success" className="shrink-0 bg-emerald-500 hover:bg-emerald-600 border-none text-white" icon={ThumbsUp} onClick={() => updateStatus(app.id, 'Accepted', app.freelancer_id)}>Accept</Button>
                               <Button variant="danger" className="shrink-0" icon={ThumbsDown} onClick={() => updateStatus(app.id, 'Rejected', app.freelancer_id)}>Reject</Button>
                             </>
                           )}

                           {/* PAY OPTION: Only visible to client when status is Accepted */}
                           {isClient && app.status === 'Accepted' && (
                              <Button variant="payment" className="shrink-0" icon={CreditCard} onClick={() => handlePayment(app.id, app.bid_amount, app.freelancer_id)}>
                                 Pay Now
                              </Button>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {tab === 'messages' && (
              <ChatSystem currentUser={user} activeChat={activeChat} setActiveChat={setActiveChat} />
            )}

            {tab === 'settings' && (
               <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-lg animate-fade-in">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="text-indigo-600" /> Profile Settings</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                     <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">{user.name[0]}</div>
                        <div>
                           <p className="font-bold text-gray-900">{user.name}</p>
                           <p className="text-sm text-gray-500">{user.email}</p>
                           <p className="text-xs text-emerald-600 font-medium mt-1">{user.type.toUpperCase()}</p>
                        </div>
                     </div>

                     <Input label="Full Name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                        <Input label="Nationality" value={profileForm.nationality} onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} />
                     </div>

                     {!isClient && (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                              <Input label="Age" value={profileForm.age} onChange={e => setProfileForm({...profileForm, age: e.target.value})} />
                              <Input label="Hourly Rate (₹)" value={profileForm.hourly_rate} onChange={e => setProfileForm({...profileForm, hourly_rate: e.target.value})} />
                           </div>
                           <Input label="UPI ID" value={profileForm.upi} onChange={e => setProfileForm({...profileForm, upi: e.target.value})} />
                        </>
                     )}

                     <div className="pt-4">
                        <Button className="w-full" icon={Save}>Save Changes</Button>
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
            <Input name="tags" label="Tags" />
            <Input name="description" label="Description" type="textarea" required />
            <Button className="w-full">Post Job</Button>
          </form>
        </Modal>
      )}
      {modal === 'apply-job' && (
        <Modal title={`Apply for ${selectedJob?.title}`} onClose={() => setModal(null)}>
          <form onSubmit={handleApplyJob} className="space-y-4">
             <div className="bg-indigo-50 p-3 rounded-lg text-indigo-700 text-sm mb-2">Client Budget: <strong>{selectedJob?.budget}</strong></div>
             <Input name="bid_amount" label="Your Bid Amount (₹)" required />
             <Input name="cover_letter" label="Cover Letter" type="textarea" placeholder="Why are you the best fit?" required />
             <Button className="w-full" variant="success">Submit Application</Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// --- MAIN APP ---
export default function TeenVerse() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        let { data: c } = await supabase.from('clients').select('*').eq('id', u.uid).single();
        if (c) { setUser({ ...c, type: 'client' }); setView('dashboard'); }
        else {
          let { data: f } = await supabase.from('freelancers').select('*').eq('id', u.uid).single();
          if (f) { setUser({ ...f, type: 'freelancer' }); setView('dashboard'); }
        }
        showToast('Logged in successfully');
      } else { setUser(null); }
    });
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { error } = await supabase.from('feedback').insert([{ name: formData.get('name'), email: formData.get('email'), message: formData.get('message') }]);
    if (!error) { showToast('Feedback sent!'); e.target.reset(); }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {view === 'home' && <LandingPage setView={setView} onFeedback={handleFeedback} />}
      {view === 'auth' && <Auth setView={setView} onLogin={(msg) => showToast(msg)} />}
      {view === 'dashboard' && user && <Dashboard user={user} setUser={setUser} onLogout={async () => { await signOut(auth); setView('home'); showToast('Logged out successfully'); }} showToast={showToast} />}
    </>
  );
}