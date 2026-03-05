import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, Send, ArrowLeft, Loader2, CheckCheck, MessageSquare, Flag, ShieldAlert, Lock, XCircle } from 'lucide-react'; 
import { supabase } from '../../supabase';
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';     
import Input from '../ui/Input';     

// AI LIBRARIES
import * as toxicity from '@tensorflow-models/toxicity';
import '@tensorflow/tfjs';

const ChatSystem = ({ user, activeChat, setActiveChat, initialMessage = "" }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [reportModalOpen, setReportModalOpen] = useState(false); 
  
  // AI STATES
  const [model, setModel] = useState(null);
  const [isToxic, setIsToxic] = useState(false);

  // --- QUICK REPLIES (Tailored by User Type) ---
  const isClient = user?.type === 'client';
  const quickReplies = isClient ? [
      "Looks great, thank you!",
      "Could we make a minor adjustment?",
      "Can you provide a status update?",
      "Approved. I will release the payment.",
      "Let me review this and get back to you."
  ] : [
      "I'll get started on this right away.",
      "Could you please clarify this requirement?",
      "The revision is ready for your review.",
      "Thanks for the feedback!",
      "I've submitted the final files."
  ];

  const handleQuickReplyClick = (reply) => {
      setInput(prev => prev ? `${prev} ${reply}` : reply);
  };

  // --- SECURITY & MODERATION FILTERS ---
  const containsPhoneNumber = (text) => {
    const phoneRegex = /(\+?\d{1,3}[\s-]?)?\d{10}/g;
    return phoneRegex.test(text);
  };

  const containsContactWords = (text) => {
    const blockedWords = [
      "whatsapp", "telegram", "call me", "phone", 
      "contact me", "@gmail", "@yahoo", "@outlook", "email"
    ];
    const lower = text.toLowerCase();
    return blockedWords.some(word => lower.includes(word));
  };

  // 1. PRE-FILL INPUT IF TEMPLATE EXISTS
  useEffect(() => {
    if (initialMessage) {
        setInput(initialMessage);
    }
  }, [initialMessage]);

  // 2. LOAD AI MODEL
  useEffect(() => {
    const loadModel = async () => {
      try {
        const threshold = 0.9; 
        const loadedModel = await toxicity.load(threshold);
        setModel(loadedModel);
      } catch (e) {
        console.error("AI Model failed to load", e);
      }
    };
    loadModel();
  }, []);

  // 3. FETCH MESSAGES (LOCKED TO APPLICATION ID)
  useEffect(() => {
    if (!activeChat?.application_id) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', activeChat.application_id)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
      setLoading(false);
    };
    fetchMessages();

    // SECURE REALTIME
    const channel = supabase
      .channel(`chat_${activeChat.application_id}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `application_id=eq.${activeChat.application_id}`
      }, (payload) => {
         const newMsg = payload.new;
         // Prevent duplicating the sender's optimistic UI message
         if (newMsg.sender_id !== user?.id) {
            setMessages((prev) => [...prev, newMsg]);
         }
      })
      .subscribe();
      
    // IMPORTANT: Use user?.id to prevent crash if user object drops during render
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, user?.id]); 

  // AUTO SCROLL
  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // 4. SEND MESSAGE
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat?.application_id) return;

    if (containsPhoneNumber(input) || containsContactWords(input)) {
        alert("Sharing phone numbers, emails, or external contact details is not allowed to protect both parties. Please communicate strictly through the platform chat.");
        return;
    }

    if (model) {
        const predictions = await model.classify([input]);
        const isBad = predictions.some(p => p.results[0].match === true);
        if (isBad) {
            setIsToxic(true);
            setTimeout(() => setIsToxic(false), 3000);
            return; 
        }
    }

    const msgData = { 
        application_id: activeChat?.application_id, 
        sender_id: user?.id, 
        receiver_id: activeChat?.id, 
        content: input
    };

    setMessages((prev) => [...prev, { ...msgData, created_at: new Date().toISOString() }]);
    setInput('');

    const { error } = await supabase.from('messages').insert([msgData]);
    if (error) console.error("Send error:", error);
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const reportData = {
        reporter_id: user?.id,
        reported_user_id: activeChat?.id,
        target_id: activeChat?.application_id,
        target_type: 'chat_violation',
        reason: formData.get('reason'),
        description: formData.get('details')
    };
    const { error } = await supabase.from('reports').insert([reportData]);
    if (error) { alert("Failed: " + error.message); } 
    else { alert("User reported."); setReportModalOpen(false); }
  };

  // Failsafe: Don't render UI if activeChat isn't fully loaded
  if (!activeChat) return null;

  // --- UI RENDER ---
  return (
    <div className="flex w-full h-full bg-[#0a0a0a] text-white overflow-hidden relative font-sans flex-col rounded-2xl md:rounded-3xl border border-gray-800 shadow-2xl">
      
      {/* TOAST ALERT */}
      <div className={`absolute top-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-[100] ${isToxic ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-red-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <ShieldAlert size={20} className="animate-pulse" />
            <span className="font-bold text-sm">Toxic Content Detected</span>
        </div>
      </div>

      {/* 1. HEADER ROW */}
      <div className="flex-none px-4 py-3 z-40 flex items-center gap-3 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/60">
          <button onClick={() => setActiveChat(null)} className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
              <ArrowLeft size={18}/>
          </button>
          
          <div className="flex-1">
              <h3 className="font-bold text-sm leading-tight">{activeChat?.name}</h3>
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                <Lock size={10} className="text-emerald-500" /> Escrow Chat ID: {activeChat?.application_id?.toString().slice(0,8)}
              </p>
          </div>

          <button 
              onClick={() => setReportModalOpen(true)} 
              className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full transition-all active:scale-95"
          >
              <Flag size={12} className="text-red-400" />
              <span className="text-[10px] font-bold text-red-400 hidden sm:block uppercase tracking-wider">Report</span>
          </button>
      </div>

      {/* 2. MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth custom-scrollbar relative bg-[#0a0a0a]">
        {loading ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-gray-600"/></div>
        ) : (
            <>
                <div className="text-center py-6 opacity-40">
                    <div className="w-12 h-12 bg-gray-800/50 border border-gray-700/50 rounded-full mx-auto flex items-center justify-center mb-2">
                        <Lock size={18} className="text-gray-400"/>
                    </div>
                    <p className="text-[11px] px-8">Secure, encrypted chat with <span className="font-bold text-white">{activeChat?.name}</span>.<br/>Do not share external contact information.</p>
                </div>

                {messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                return (
                    <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-[13px] shadow-sm relative border
                        ${isMe 
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-50 rounded-[18px] rounded-tr-sm' 
                            : 'bg-gray-800/50 border-gray-700/50 text-gray-200 rounded-[18px] rounded-tl-sm'
                        }`
                        }>
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        
                        <div className="text-[9px] mt-1.5 flex items-center gap-1 justify-end opacity-40 font-bold tracking-widest">
                            {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            {isMe && <CheckCheck size={12}/>}
                        </div>
                        </div>
                    </div>
                );
                })}
                <div ref={scrollRef}></div>
            </>
        )}
      </div>

      {/* 3. QUICK REPLIES & INPUT BAR */}
      <div className="flex-none p-3 bg-gray-900/80 backdrop-blur-md border-t border-gray-800/60 z-30 flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1">Quick Reply:</span>
            {quickReplies.map((reply, index) => (
                <button
                    key={index}
                    onClick={() => handleQuickReplyClick(reply)}
                    className="whitespace-nowrap px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] rounded-full transition-colors border border-gray-700 shrink-0"
                >
                    {reply}
                </button>
            ))}
        </div>

        <div className="relative flex items-end gap-2 max-w-4xl mx-auto w-full">
          <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Type your message..." 
              rows={1}
              className="flex-1 bg-black/50 border border-gray-700 text-white rounded-[20px] py-2.5 px-4 focus:outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all resize-none min-h-[44px] max-h-[120px] text-sm custom-scrollbar" 
          />
          
          <button 
              onClick={sendMessage}
              disabled={!input.trim()} 
              className="w-11 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none shrink-0"
          >
              <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </div>

      {/* REPORT MODAL */}
      {reportModalOpen && (
          <Modal title="Report Message" onClose={() => setReportModalOpen(false)}>
              <form onSubmit={handleReportUser} className="space-y-4">
                  <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20">All reports are reviewed by our trust and safety team.</div>
                  <Input name="reason" type="select" options={["Asking for payment outside platform", "Harassment", "Spam", "Other"]} className="bg-gray-900 border-gray-800 text-white"/>
                  <Input name="details" type="textarea" placeholder="Provide context..." className="bg-gray-900 border-gray-800 text-white min-h-[100px]"/>
                  <div className="flex gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setReportModalOpen(false)} className="w-full text-gray-400 hover:bg-gray-800">Cancel</Button>
                      <Button className="w-full bg-red-600 hover:bg-red-500 text-white shadow-lg">Submit</Button>
                  </div>
              </form>
          </Modal>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default ChatSystem;