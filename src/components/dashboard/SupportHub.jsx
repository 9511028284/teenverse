import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Mail, ShieldAlert, Phone, Users, ExternalLink, 
    Send, Loader2, CheckCircle, Clock, Lock 
} from 'lucide-react';
import Button from '../ui/Button'; 
import { supabase } from '../../supabase'; 

const SupportHub = ({ user, showToast }) => {
  const plan = user?.current_plan || 'Basic';

  // --- TICKET / CHAT STATES ---
  const [messages, setMessages] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState(''); 
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🚀 Fetch Existing Ticket (Only if they aren't on Basic)
  useEffect(() => {
    if (plan === 'Basic') {
        setLoading(false);
        return;
    }

    let channel;

    const fetchTicket = async () => {
      const { data: tickets, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);

      if (ticketErr) {
          showToast?.("Failed to load support hub.", "error");
          setLoading(false);
          return;
      }

      if (tickets && tickets.length > 0) {
        const activeTicketId = tickets[0].id;
        setTicketId(activeTicketId);
        setIsComposing(false); // They have an active ticket, show chat view

        const { data: msgs } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', activeTicketId)
          .order('created_at', { ascending: true });
        
        if (msgs) setMessages(msgs);

        // Subscribe to Admin replies
        channel = supabase
          .channel(`ticket_${activeTicketId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'support_messages', 
            filter: `ticket_id=eq.${activeTicketId}` 
          }, (payload) => {
            setMessages(prev => [...prev, payload.new]);
          })
          .subscribe();

      } else {
        // No active ticket found -> Show Email Composer
        setIsComposing(true);
      }
      setLoading(false);
    };

    fetchTicket();

    return () => {
        if (channel) supabase.removeChannel(channel);
    };
  }, [user.id, plan, showToast]);

  // 🚀 Submit the Initial Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
        return showToast?.("Please fill out both fields.", "error");
    }

    setLoading(true);
    try {
        const { data: newTicket, error: createErr } = await supabase
            .from('support_tickets')
            .insert({ user_id: user.id, subject: subject.trim() })
            .select()
            .single();
            
        if (createErr || !newTicket) throw new Error("Could not create ticket.");
        
        await supabase
            .from('support_messages')
            .insert({
                ticket_id: newTicket.id,
                sender_id: user.id,
                is_admin: false,
                message: description.trim()
            });

        // Trigger Confirmation Email
        supabase.functions.invoke('send-parent-otp', {
            body: {
                type: "ticket",
                action: "raised",
                userEmail: user.email,
                userName: user.name,
                ticketId: newTicket.id,
                subject: subject.trim()
            }
        }).catch(err => console.error("Email trigger failed:", err));

        // Shift to Chat View
        setTicketId(newTicket.id);
        setMessages([{
            id: 'temp-1',
            sender_id: user.id,
            is_admin: false,
            message: description.trim(),
            created_at: new Date().toISOString()
        }]);
        
        setIsComposing(false);
        showToast?.("Ticket submitted successfully!", "success");

    } catch (err) {
        showToast?.(err.message, "error");
    } finally {
        setLoading(false);
    }
  };

  // 🚀 Handle sending subsequent replies in the chat view
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !ticketId) return;

    const messageText = replyText.trim();
    setReplyText(''); 

    const { error } = await supabase
        .from('support_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            is_admin: false,
            message: messageText
        });

    if (error) {
        showToast?.("Failed to send.", "error");
    } else {
        await supabase.from('support_tickets').update({ updated_at: new Date() }).eq('id', ticketId);
    }
  };

  // --- EXTERNAL LINKS ---
  const handleEmailSupport = () => window.location.href = 'mailto:support@teenversehub.in';
  
  const handleWhatsApp = () => {
    if (plan !== 'Elite') return showToast?.("WhatsApp support is for Elite members only.", "error");
    window.open('https://wa.me/+919511028284', '_blank'); 
  };

  const handleJoinCommunity = async () => {
    if (plan === 'Basic' || plan === 'Starter') {
        return showToast?.("Upgrade to Pro or Elite to join the Private Community!", "error");
    }
    showToast?.("Generating your secure 1-time Discord invite...", "info");
    try {
        const { data, error } = await supabase.functions.invoke('generate-discord-invite');
        if (error || !data?.success) throw new Error(data?.error || "Could not generate link.");
        showToast?.("Welcome to the VIP Lounge! Redirecting...", "success");
        setTimeout(() => window.open(data.inviteUrl, '_blank'), 1500);
    } catch (err) {
        showToast?.(err.message, "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Help & Community</h2>
          <p className="text-slate-500">Your current access level: <span className="font-bold text-indigo-600 dark:text-indigo-400">{plan}</span></p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: THE FOUNDER HELP DESK WIDGET */}
        {/* ========================================== */}
        <div className="lg:col-span-7 flex flex-col h-[650px] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden relative">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                    <MessageSquare size={20}/>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Founder Help Desk</h3>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Premium Support</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative p-5 bg-slate-50/50 dark:bg-[#0B0F19]">
                
                {plan === 'Basic' ? (
                    // 🔒 LOCKED STATE FOR BASIC USERS
                    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/60 dark:bg-black/60 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Lock size={24} className="text-slate-400" />
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-xl mb-2">Help Desk Locked</h4>
                        <p className="text-sm text-slate-500 max-w-xs mb-6">Direct in-app ticketing and founder support is reserved for our Premium members.</p>
                        <span className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                            Upgrade to Unlock
                        </span>
                    </div>
                ) : loading ? (
                    // ⏳ LOADING STATE
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                    </div>
                ) : isComposing ? (
                    // 📝 EMAIL COMPOSER VIEW
                    <form onSubmit={handleSubmitTicket} className="flex-1 flex flex-col h-full space-y-4">
                        <div className="mb-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Describe your issue in detail. A founder will review it and reply back to you here.</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Account locked, Payment issue, Bug report"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-slate-900 dark:text-white shadow-sm font-medium transition-all"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Detailed Description</label>
                            <textarea 
                                required
                                placeholder="Please provide as much context as possible..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-slate-900 dark:text-white shadow-sm resize-none transition-all leading-relaxed"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={!subject.trim() || !description.trim()}
                            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-black uppercase tracking-wider text-sm shadow-xl shadow-indigo-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2 shrink-0"
                        >
                            Submit Ticket <Send size={16}/>
                        </button>
                    </form>
                ) : (
                    // 💬 ACTIVE CHAT VIEW
                    <>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-3 rounded-xl mb-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Clock size={16}/>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Ticket Active</p>
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">ID: {ticketId?.split('-')[0].toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-black/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/30">
                                In Progress
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                            {messages.map((msg, idx) => {
                                const isAdmin = msg.is_admin;
                                return (
                                    <div key={idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${
                                            isAdmin 
                                            ? 'bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 rounded-tl-sm border border-slate-100 dark:border-white/5' 
                                            : 'bg-indigo-600 text-white rounded-tr-sm'
                                        }`}>
                                            {isAdmin && <span className="block text-[10px] font-black text-indigo-500 mb-1.5 uppercase tracking-wider flex items-center gap-1"><CheckCircle size={10}/> TeenVerseHub Support</span>}
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                            <span className={`block text-[9px] mt-2 opacity-60 font-medium ${isAdmin ? 'text-left' : 'text-right'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendReply} className="relative flex items-center shrink-0">
                            <input 
                                type="text" 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type a follow-up reply..."
                                className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-4 pr-14 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-slate-900 dark:text-white transition-all shadow-sm"
                            />
                            <button 
                                type="submit" 
                                disabled={!replyText.trim()}
                                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: EXTERNAL CONTACT & VIP SECTION */}
        {/* ========================================== */}
        <div className="lg:col-span-5 space-y-6">
            
            {/* Standard Email Card */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><ShieldAlert size={20}/> Standard Support</h3>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-transparent">
                    <div className="flex items-center gap-3">
                        <Mail className="text-slate-400" />
                        <div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Email Support</h4>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">support@teenversehub.in</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleEmailSupport}>Email</Button>
                </div>
            </div>

            {/* VIP WhatsApp Card */}
            <div className={`bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm transition-all ${plan !== 'Elite' ? 'opacity-60 grayscale relative overflow-hidden' : 'border-amber-200 dark:border-amber-500/30'}`}>
                {plan !== 'Elite' && <div className="absolute inset-0 z-10 cursor-not-allowed"></div>}
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><Phone className="text-amber-500" size={20}/> Elite Fast-Lane</h3>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">VIP WhatsApp Line</h4>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Under 1 hr response</p>
                    </div>
                    {plan !== 'Elite' ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">Locked</span>
                    ) : (
                        <Button size="sm" onClick={handleWhatsApp} className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black shadow-lg shadow-amber-500/20">Message</Button>
                    )}
                </div>
            </div>

            {/* Exclusive Discord Community */}
            <div className="bg-gradient-to-br from-fuchsia-600 to-purple-800 border border-fuchsia-500/30 rounded-3xl p-6 shadow-xl shadow-fuchsia-500/20 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="relative z-10 mb-6">
                    <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><Users size={24}/> Founder's Lounge</h3>
                    <p className="text-fuchsia-100 text-sm leading-relaxed">
                        Join our private Discord server. Network with top-tier freelancers, get direct feedback, and access exclusive "Pro-Only" job leads.
                    </p>
                </div>

                <div className="relative z-10 mt-auto">
                    {plan === 'Basic' || plan === 'Starter' ? (
                        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                            <p className="text-sm font-bold text-fuchsia-200">Upgrade to Pro or Elite to unlock.</p>
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
    </div>
  );
};

export default SupportHub;