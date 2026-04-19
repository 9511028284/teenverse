import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Mail, ShieldAlert, Send, 
    Loader2, CheckCircle, Clock, Info 
} from 'lucide-react';
import Button from '../ui/Button'; 
import { supabase } from '../../supabase'; 

const SupportHub = ({ user, showToast }) => {
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

  // 🚀 Fetch Existing Ticket (Now Free & Unlocked for Everyone)
  useEffect(() => {
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
  }, [user.id, showToast]);

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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Help & Support</h2>
          <p className="text-gray-500 font-medium">We're here to ensure your projects run smoothly.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: THE HELP DESK WIDGET */}
        {/* ========================================== */}
        <div className="lg:col-span-8 flex flex-col h-[650px] bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden relative">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                    <MessageSquare size={20}/>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">Priority Help Desk</h3>
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">In-App Support</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative p-5 bg-white dark:bg-[#0B0F19]">
                
                {loading ? (
                    // ⏳ LOADING STATE
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                    </div>
                ) : isComposing ? (
                    // 📝 EMAIL COMPOSER VIEW
                    <form onSubmit={handleSubmitTicket} className="flex-1 flex flex-col h-full space-y-4">
                        <div className="mb-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Describe your issue in detail. Our team will review it and reply directly in this chat.</p>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Subject</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Question about billing, Dispute resolution"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-gray-900 dark:text-white shadow-sm font-medium transition-all"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Detailed Description</label>
                            <textarea 
                                required
                                placeholder="Please provide as much context as possible..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full flex-1 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-gray-900 dark:text-white shadow-sm resize-none transition-all leading-relaxed"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={!subject.trim() || !description.trim()}
                            className="w-full py-4 mt-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.98] text-white dark:text-black rounded-xl font-black uppercase tracking-wider text-sm shadow-xl shadow-black/10 dark:shadow-white/10 disabled:opacity-50 transition-all flex justify-center items-center gap-2 shrink-0"
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
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                                            isAdmin 
                                            ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200 dark:border-white/5' 
                                            : 'bg-indigo-600 text-white rounded-tr-sm'
                                        }`}>
                                            {isAdmin && <span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><CheckCircle size={10}/> Support Team</span>}
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
                                placeholder="Type your reply here..."
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 rounded-2xl py-3.5 pl-4 pr-14 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-gray-900 dark:text-white transition-all shadow-sm"
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
        {/* RIGHT COLUMN: CONTACT & GUIDELINES */}
        {/* ========================================== */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Standard Email Card */}
            <div className="bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><ShieldAlert size={20}/> Contact Support</h3>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <Mail className="text-gray-400" />
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 dark:text-white">Email Us directly</h4>
                                <p className="text-xs text-gray-500 font-medium tracking-wide">support@teenversehub.in</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleEmailSupport}>Compose Email</Button>
                </div>
            </div>

            {/* Support Guidelines / SLA Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-[#0B0F19] dark:to-gray-900 border border-indigo-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                    <Info size={20} className="text-indigo-500"/> Support Guidelines
                </h3>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            <strong className="text-gray-900 dark:text-white">Response Time:</strong> Our team typically responds within 12-24 hours via the Help Desk.
                        </p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            <strong className="text-gray-900 dark:text-white">Dispute Resolution:</strong> If an issue arises with a freelancer, open a ticket immediately before releasing escrow funds.
                        </p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            <strong className="text-gray-900 dark:text-white">Business Hours:</strong> Mon-Fri, 9:00 AM – 6:00 PM (IST).
                        </p>
                    </li>
                </ul>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SupportHub;