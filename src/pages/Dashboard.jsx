import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Menu, LayoutDashboard, Briefcase, FileText, MessageSquare, BookOpen, Sparkles, Settings, LogOut, 
  Award, Sun, Moon, Bell, Search, Filter, PlusCircle, Zap, Lock, Check, Clock, Trash2, ThumbsUp, CreditCard, 
  Receipt, X, CheckCircle, Package, Save, Share2, Download, 
  Trophy, Unlock, Swords, Heart, Crown, ShieldCheck, FileCheck
} from 'lucide-react';
import { supabase } from '../supabase';
import { CATEGORIES, COLORS, QUIZZES, } from '../utils/constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ChatSystem from '../components/features/ChatSystem';
import Pricing from './Pricing';

const Dashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme }) => {
  const isClient = user.type === 'client';
  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Data States
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]); 
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // UI States
  const [showNotifications, setShowNotifications] = useState(false); 
  const [modal, setModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const lastNotificationId = useRef(null);
  
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [profileForm, setProfileForm] = useState({ ...user });

  // Feature States
  const [paymentModal, setPaymentModal] = useState(null); 
  const [parentMode, setParentMode] = useState(false);
  const [unlockedSkills, setUnlockedSkills] = useState(user.unlockedSkills || []);
  const [badges, setBadges] = useState(user.badges || ['Verified']);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [rawPortfolioText, setRawPortfolioText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [quizState, setQuizState] = useState({ selected: null, status: 'idle' }); 
   

  useEffect(() => {
    const fetchData = async () => {
      const { data: allServices } = await supabase.from('services').select('*').order('created_at', {ascending: false});
      if (!isClient) {
         setServices(allServices?.filter(s => s.freelancer_id === user.id) || []);
      } else {
         setServices(allServices || []);
      }

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
    return matchesSearch;
  });

  const handlePostJob = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jobData = { client_id: user.id, client_name: user.name, title: formData.get('title'), budget: formData.get('budget'), job_type: formData.get('type'), duration: formData.get('duration'), tags: formData.get('tags'), description: formData.get('description'), category: formData.get('category') || 'dev' };
    const { error } = await supabase.from('jobs').insert([jobData]);
    if (error) showToast(error.message, 'error'); else { showToast('Job Posted!'); setModal(null); }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceData = {
      freelancer_id: user.id,
      freelancer_name: user.name,
      title: formData.get('title'),
      description: formData.get('description'),
      price: formData.get('price'),
      delivery_time: formData.get('delivery_time'),
      category: formData.get('category')
    };
    const { error } = await supabase.from('services').insert([serviceData]);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Gig Created Successfully!');
      setModal(null);
      setServices([serviceData, ...services]);
    }
  };

  const handleDeleteService = async (id) => {
    if(!window.confirm("Are you sure you want to delete this gig?")) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Service Deleted');
      setServices(services.filter(s => s.id !== id));
    }
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
    
    const cleanUpdates = {
        name: profileForm.name,
        phone: profileForm.phone,
        nationality: profileForm.nationality
    };

    if (!isClient) {
        cleanUpdates.age = profileForm.age;
        cleanUpdates.qualification = profileForm.qualification;
        cleanUpdates.specialty = profileForm.specialty;
        cleanUpdates.services = profileForm.services;
        cleanUpdates.upi = profileForm.upi;
    } else {
        cleanUpdates.is_organisation = profileForm.is_organisation;
    }

    const { error } = await supabase.from(tableName).update(cleanUpdates).eq('id', user.id);
    if (error) { 
      showToast(error.message, 'error'); 
    } else { 
      showToast("Profile updated successfully!"); 
      setUser({ ...user, ...cleanUpdates }); 
    }
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

  const handleQuizSelection = async (categoryId, answer) => {
    const correctAnswer = QUIZZES[categoryId]?.answer;
    if (!correctAnswer) return;
    setQuizState({ selected: answer, status: answer === correctAnswer ? 'correct' : 'incorrect' });

    if (answer === correctAnswer) {
      setTimeout(async () => {
        const newSkills = [...unlockedSkills, categoryId];
        setUnlockedSkills(newSkills);
        setBadges([...badges, 'Skill Unlocked']);
        await supabase.from('freelancers').update({ unlocked_skills: newSkills }).eq('id', user.id);
        setUser({ ...user, unlockedSkills: newSkills });
        setModal(null); 
        setQuizState({ selected: null, status: 'idle' });
        showToast("🎉 Skill Unlocked! +500 XP", "success");
      }, 1500);
    } else {
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

  const handleJoinBattle = (battleId) => {
    if (parentMode) return;
    showToast("Battle Joined! Submit your work before deadline.");
  };
  
  const handleVote = (battleId, entryId) => {
     if (parentMode) return;
     const updatedBattles = activeBattles.map(b => {
       if(b.id === battleId) {
         return { ...b, entries: b.entries.map(e => e.id === entryId ? {...e, votes: e.votes + 1} : e) }
       }
       return b;
     });
     setActiveBattles(updatedBattles);
     showToast("Voted! Good choice.");
  };

  const handleDownloadCard = () => {
    alert("In a real app, this would download the image using html2canvas! For now, take a screenshot to share on Instagram.");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      
      {/* SIDEBAR (FIXED SCROLL & VISIBILITY) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 flex flex-col h-[100dvh]`}>
        
        {/* Sidebar Header */}
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900 dark:text-white"><div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${COLORS.primary} flex items-center justify-center text-white`}><Rocket size={16} /></div>TeenVerse</div>
          <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white"><X/></button>
        </div>

        {/* Sidebar Menu - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
           <button onClick={() => {setTab('overview'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'overview' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><LayoutDashboard size={18}/> Dashboard</button>
           
           
           <button onClick={() => {setTab('jobs'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'jobs' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Briefcase size={18}/> {isClient ? 'Find Services' : 'Find Work'}</button>
           
           {!isClient && <button onClick={() => {setTab('my-services'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'my-services' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Package size={18}/> My Services</button>}
           
           <button onClick={() => {setTab('applications'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'applications' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><FileText size={18}/> {isClient ? 'Applicants' : 'My Applications'}</button>
           
           <button onClick={() => {setTab('messages'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'messages' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><MessageSquare size={18}/> Messages</button>
           
           {!isClient && (
             <>
               <button onClick={() => {setTab('academy'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'academy' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><BookOpen size={18}/> Academy</button>
               
               
               <button onClick={() => {setTab('portfolio'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'portfolio' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Sparkles size={18}/> Portfolio AI</button>
               
               <button onClick={() => {setTab('profile-card'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'profile-card' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Share2 size={18}/> Share Profile</button>
             </>
           )}
           
           {/* RECORDS & COMPLIANCE TAB */}
           <button onClick={() => {setTab('records'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'records' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><FileCheck size={18}/> Records & Compliance</button>

           <button onClick={() => {setTab('settings'); setMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Settings size={18}/> Settings</button>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
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
               <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{tab === 'profile-card' ? 'Share Your Card' : tab}</h2>
            </div>
            <div className="flex items-center gap-4 relative">
               {isClient && !parentMode && <Button variant="primary" icon={PlusCircle} onClick={() => setModal('post-job')}>Post Job</Button>}
               {!isClient && tab === 'my-services' && <Button variant="primary" icon={PlusCircle} onClick={() => setModal('create-service')}>Create Gig</Button>}
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
           

            {/* RECORDS & COMPLIANCE TAB */}
            {tab === 'records' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                     <ShieldCheck className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24}/>
                     <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-300 text-lg">Transparency & Safety Records</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                           TeenVerse maintains a permanent record of all contracts and financial transactions to comply with safety standards. 
                           These records are available for parental audit at any time.
                        </p>
                     </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-lg dark:text-white">Contract & Payment History</h3>
                     </div>
                     <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold">
                           <tr>
                              <th className="p-4">Job ID</th>
                              <th className="p-4">Date</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Amount</th>
                              <th className="p-4 text-right">Record</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                           {applications.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">No records found yet.</td></tr>}
                           {applications.map(app => (
                              <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                 <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">#{app.job_id.slice(0,8)}</td>
                                 <td className="p-4 text-sm dark:text-gray-300">{new Date(app.created_at).toLocaleDateString()}</td>
                                 <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${app.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                       {app.status}
                                    </span>
                                 </td>
                                 <td className="p-4 font-bold dark:text-white">₹{app.bid_amount}</td>
                                 <td className="p-4 text-right">
                                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Download PDF</button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

                    

            {/* ACADEMY TAB */}
            {tab === 'academy' && !isClient && (
               <div className="space-y-8 animate-fade-in">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                     <div className="relative z-10 flex justify-between items-end">
                        <div>
                           <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Trophy size={32} className="text-yellow-300"/> Level {Math.floor(unlockedSkills.length / 2) + 1} Freelancer</h2>
                           <p className="text-indigo-100">Complete quizzes to unlock new job categories and earn badges!</p>
                        </div>
                     </div>
                     <div className="mt-6 h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-yellow-400 transition-all duration-1000 ease-out" style={{ width: `${(unlockedSkills.length / 4) * 100}%` }}></div>
                     </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                     {CATEGORIES.map((cat) => {
                       const isUnlocked = unlockedSkills.includes(cat.id);
                       return (
                         <div key={cat.id} className={`relative bg-white dark:bg-gray-900 p-6 rounded-2xl border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${isUnlocked ? 'border-emerald-200 dark:border-emerald-900/50 shadow-emerald-100 dark:shadow-none' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900'}`}>
                            <div className="flex items-start gap-4 mb-6">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>{cat.icon}</div>
                               <div><h3 className="font-bold text-lg dark:text-white">{cat.name}</h3><p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{cat.description}</p></div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                               <div className="text-xs font-bold text-gray-400 flex items-center gap-1"><Zap size={14} className="fill-yellow-400 text-yellow-400"/> +500 XP</div>
                               <Button variant={isUnlocked ? "success" : "primary"} onClick={() => !isUnlocked && setModal(`quiz-${cat.id}`)} disabled={isUnlocked} className={`h-10 px-6 text-xs ${isUnlocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none' : ''}`}>{isUnlocked ? "Unlocked" : "Start Quiz"}</Button>
                            </div>
                         </div>
                       )
                     })}
                  </div>
               </div>
            )}

            {/* PORTFOLIO TAB */}
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

            {/* PROFILE CARD TAB */}
            {tab === 'profile-card' && !isClient && (
                <div className="flex flex-col items-center justify-center animate-fade-in">
                   <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[32px] w-[350px] text-white shadow-2xl border border-gray-800 relative overflow-hidden group hover:scale-105 transition-transform duration-500">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity"></div>

                      <div className="relative z-10 flex flex-col items-center text-center">
                         <div className="w-24 h-24 rounded-full border-4 border-indigo-500 p-1 mb-4">
                             <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-4xl font-bold text-indigo-300">
                                 {user.name[0]}
                             </div>
                         </div>
                         <h2 className="text-2xl font-black tracking-tight">{user.name}</h2>
                         <p className="text-indigo-400 font-medium mb-6">TeenVerse {user.role}</p>
                         <div className="grid grid-cols-2 gap-4 w-full mb-6">
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                               <div className="text-2xl font-bold text-yellow-400">{Math.floor(unlockedSkills.length / 2) + 1}</div>
                               <div className="text-xs opacity-70 uppercase tracking-widest">Level</div>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                               <div className="text-2xl font-bold text-emerald-400">{badges.length}</div>
                               <div className="text-xs opacity-70 uppercase tracking-widest">Badges</div>
                            </div>
                         </div>
                         <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {unlockedSkills.length === 0 && <span className="text-xs opacity-50">No skills unlocked yet</span>}
                            {unlockedSkills.map(skill => (
                                <span key={skill} className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-300 uppercase">
                                    {skill}
                                </span>
                            ))}
                         </div>
                         <div className="w-full pt-6 border-t border-white/10 flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Rocket size={16}/></div>
                                <span className="font-bold text-sm">TeenVerse</span>
                             </div>
                             <div className="text-xs opacity-50">Find me here!</div>
                         </div>
                      </div>
                   </div>
                   <div className="mt-8 text-center">
                      <Button variant="primary" icon={Download} onClick={handleDownloadCard}>Download Story Card</Button>
                      <p className="text-xs text-gray-500 mt-3">Perfect for Instagram Stories & WhatsApp Status</p>
                   </div>
                </div>
            )}

            {/* MY SERVICES TAB */}
            {tab === 'my-services' && !isClient && (
               <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                  {services.map(service => (
                     <div key={service.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative group">
                        <button onClick={() => handleDeleteService(service.id)} className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                        <h3 className="font-bold text-lg dark:text-white mb-1">{service.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{service.description}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                           <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₹{service.price}</span>
                           <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 flex items-center gap-1"><Clock size={12}/> {service.delivery_time}</span>
                        </div>
                     </div>
                  ))}
                  <div onClick={() => setModal('create-service')} className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-gray-400 hover:text-indigo-600">
                     <PlusCircle size={32} className="mb-2"/>
                     <span className="font-bold">Create New Gig</span>
                  </div>
               </div>
            )}

            {/* JOBS TAB */}
            {tab === 'jobs' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                     <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800 px-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Search size={18} className="text-gray-400" />
                        <input placeholder={isClient ? "Search for services..." : "Search jobs..."} className="w-full bg-transparent border-none py-3 px-3 focus:outline-none text-sm dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                     </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                     {isClient && services.map(service => (
                        <div key={service.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                           <div className="flex justify-between items-start mb-4">
                              <div><h3 className="font-bold text-lg dark:text-white">{service.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">by {service.freelancer_name}</p></div>
                              <span className="font-black text-lg bg-gray-50 dark:bg-gray-800 dark:text-white px-3 py-1 rounded-lg">₹{service.price}</span>
                           </div>
                           <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{service.description}</p>
                           <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-4">
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-1"><Clock size={14}/> {service.delivery_time}</div>
                              <Button className="py-2 px-4 text-xs" onClick={() => {
                                 setActiveChat({ id: service.freelancer_id, name: service.freelancer_name, defaultMessage: `Hi, I'm interested in your gig: ${service.title}` });
                                 setTab('messages');
                              }}>Contact Seller</Button>
                           </div>
                        </div>
                     ))}
                     {!isClient && filteredJobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-indigo-100 dark:hover:border-indigo-900 transition-all relative">
                           <div className="flex justify-between items-start mb-4 pr-10">
                              <div><h3 className="font-bold text-lg dark:text-white">{job.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{job.client_name}</p></div>
                              <span className="font-black text-lg bg-gray-50 dark:bg-gray-800 dark:text-white px-3 py-1 rounded-lg">{job.budget}</span>
                           </div>
                           <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{job.description}</p>
                           <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-4">
                              {!parentMode && (
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
                     <Input label="Full Name" value={profileForm.name || ""} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={profileForm.phone || ""} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                        <Input label="Nationality" value={profileForm.nationality || ""} onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} />
                     </div>

                     {!isClient && (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                              <Input label="Age" value={profileForm.age || ""} onChange={e => setProfileForm({...profileForm, age: e.target.value})} />
                              <Input label="Qualification" value={profileForm.qualification || ""} onChange={e => setProfileForm({...profileForm, qualification: e.target.value})} />
                           </div>
                           <Input label="Specialty" value={profileForm.specialty || ""} onChange={e => setProfileForm({...profileForm, specialty: e.target.value})} />
                           <Input label="Services Offered" value={profileForm.services || ""} onChange={e => setProfileForm({...profileForm, services: e.target.value})} />
                           <Input label="UPI ID" value={profileForm.upi || ""} onChange={e => setProfileForm({...profileForm, upi: e.target.value})} />
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

      {/* SERVICE CREATION MODAL */}
      {modal === 'create-service' && (
        <Modal title="Create a Gig" onClose={() => setModal(null)}>
          <form onSubmit={handleCreateService} className="space-y-4">
            <Input name="title" label="Gig Title" placeholder="I will design a logo..." required />
            <div className="grid grid-cols-2 gap-4">
               <Input name="price" label="Price (₹)" required />
               <Input name="delivery_time" label="Delivery Time" placeholder="e.g. 3 Days" required />
            </div>
            <Input name="category" label="Category" type="select" options={["dev", "design", "video", "music"]} />
            <Input name="description" label="Description" type="textarea" required />
            <Button className="w-full">Publish Gig</Button>
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
      
      {/* QUIZ MODAL */}
      {modal?.startsWith('quiz-') && (
        <Modal title="Skill Assessment" onClose={() => {setModal(null); setQuizState({selected: null, status: 'idle'})}}>
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded dark:bg-indigo-900 dark:text-indigo-300">Question 1/1</span>
                 <span className="text-xs text-gray-400">Win +500 XP</span>
              </div>
              <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{QUIZZES[modal.replace('quiz-', '')]?.question}</h3>
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
                          <button key={opt} onClick={() => handleQuizSelection(modal.replace('quiz-', ''), opt)} className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all flex justify-between items-center ${btnClass}`} disabled={quizState.status !== 'idle'}>
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

      {paymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 transition-all border border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white text-center">
                    <CreditCard size={48} className="mx-auto mb-2 opacity-80"/>
                    <h2 className="text-2xl font-bold">Confirm Payment</h2>
                    <p className="opacity-90 text-sm">Secure Transaction • TeenVerse SafePay</p>
                </div>
                <div className="p-8 space-y-4">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400"><span>Service Cost</span><span>₹{paymentModal.amount}</span></div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400"><span>Platform Fee (4%)</span><span className="text-red-500">- ₹{(paymentModal.amount * 0.04).toFixed(2)}</span></div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white"><span>Total Pay</span><span>₹{paymentModal.amount}</span></div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-center mt-4"><p className="text-xs text-emerald-700 dark:text-emerald-400">Freelancer receives: <span className="font-bold text-sm">₹{(paymentModal.amount * 0.96).toFixed(2)}</span></p></div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button onClick={() => setPaymentModal(null)} className="py-3 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                        <button onClick={processPayment} className="py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-200 hover:shadow-fuchsia-300 transition-all flex items-center justify-center gap-2"><Receipt size={16} /> Confirm</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;