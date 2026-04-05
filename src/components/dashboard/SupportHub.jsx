import React from 'react';
import { MessageSquare, Mail, ShieldAlert, Phone, Users, ExternalLink } from 'lucide-react';
import Button from '../ui/Button'; // Adjust path if needed
import { supabase } from '../../supabase'; // Adjust path to your supabase client

// 🚀 ADDED setModal to the props!
const SupportHub = ({ user, showToast, setModal }) => {
  const plan = user?.current_plan || 'Basic';

  // 🚀 Mailto link points exactly to your .in domain!
  const handleEmailSupport = () => {
      window.location.href = 'mailto:support@teenversehub.in';
  };
  
  // 🚀 IN-HOUSE CUSTOM CHAT INTEGRATION
  const handleOpenChat = () => {
      // Tells DashboardModals.jsx to open your custom chat UI
      setModal('support-chat'); 
  };

  // 🚀 DISCORD VIP INVITE INTEGRATION
  const handleJoinCommunity = async () => {
    if (plan === 'Basic' || plan === 'Starter') {
        return showToast("Upgrade to Pro or Elite to join the Private Community!", "error");
    }
    
    showToast("Generating your secure 1-time Discord invite...", "info");
    
    try {
        const { data, error } = await supabase.functions.invoke('generate-discord-invite');
        
        if (error || !data?.success) {
            throw new Error(data?.error || "Could not generate link.");
        }
        
        showToast("Welcome to the VIP Lounge! Redirecting...", "success");
        setTimeout(() => window.open(data.inviteUrl, '_blank'), 1500);
        
    } catch (err) {
        showToast(err.message, "error");
    }
  };

  const handleWhatsApp = () => {
    if (plan !== 'Elite') return showToast("WhatsApp support is for Elite members only.", "error");
    window.open('https://wa.me/+919511028284', '_blank'); 
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Help & Community</h2>
      <p className="text-slate-500 mb-8">Your current access level: <span className="font-bold text-indigo-600">{plan}</span></p>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* 1. TIERED SUPPORT SECTION */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert size={20}/> Contact Support</h3>
          
          <div className="space-y-4">
            
            {/* EVERYONE GETS EMAIL */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                 <Mail className="text-slate-400" />
                 <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Email Support</h4>
                    <p className="text-xs text-slate-500 font-medium tracking-wide">support@teenversehub.in</p>
                 </div>
              </div>
              <Button variant="ghost" onClick={handleEmailSupport}>Email Us</Button>
            </div>

            {/* STARTER & ABOVE GET IN-APP CHAT (Custom UI) */}
            <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${plan === 'Basic' ? 'opacity-50 grayscale select-none' : 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30'}`}>
              <div className="flex items-center gap-3">
                 <MessageSquare className="text-indigo-500" />
                 <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Founder / Team Chat</h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Direct in-app messaging</p>
                 </div>
              </div>
              {plan === 'Basic' ? (
                 <span className="text-xs font-bold text-slate-400 uppercase">Locked</span>
              ) : (
                 <Button onClick={handleOpenChat} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">Open Chat</Button>
              )}
            </div>

            {/* ELITE ONLY GETS WHATSAPP */}
            <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${plan !== 'Elite' ? 'opacity-50 grayscale select-none' : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30'}`}>
              <div className="flex items-center gap-3">
                 <Phone className="text-amber-500" />
                 <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">VIP WhatsApp Line</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Under 1 hr response</p>
                 </div>
              </div>
              {plan !== 'Elite' ? (
                 <span className="text-xs font-bold text-slate-400 uppercase">Elite Only</span>
              ) : (
                 <Button onClick={handleWhatsApp} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-black shadow-lg shadow-amber-500/20">Message</Button>
              )}
            </div>
          </div>
        </div>

        {/* 2. EXCLUSIVE COMMUNITY SECTION */}
        <div className="bg-gradient-to-br from-fuchsia-600 to-purple-800 border border-fuchsia-500/30 rounded-3xl p-6 shadow-xl shadow-fuchsia-500/20 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
           
           <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><Users size={24}/> The Founder's Lounge</h3>
              <p className="text-fuchsia-100 text-sm leading-relaxed mb-6">
                Join our private Discord server. Network with top-tier freelancers, get direct feedback from the founders, and access exclusive "Pro-Only" job leads before they hit the main board.
              </p>
              
              <ul className="space-y-2 mb-8">
                 <li className="flex items-center gap-2 text-sm"><span className="text-fuchsia-300">✓</span> Private networking channels</li>
                 <li className="flex items-center gap-2 text-sm"><span className="text-fuchsia-300">✓</span> Direct Q&A with founders</li>
                 <li className="flex items-center gap-2 text-sm"><span className="text-fuchsia-300">✓</span> Early access to high-paying clients</li>
              </ul>
           </div>

           <div className="relative z-10">
             {plan === 'Basic' || plan === 'Starter' ? (
                 <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                    <p className="text-sm font-bold text-fuchsia-200 mb-2">Upgrade to Pro or Elite to unlock.</p>
                 </div>
             ) : (
                 <Button onClick={handleJoinCommunity} className="w-full py-4 bg-white text-fuchsia-800 hover:bg-slate-100 font-black flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                    Join Discord Server <ExternalLink size={18}/>
                 </Button>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SupportHub;