import React, { useRef, useEffect, useState } from 'react';
import { Send, ArrowLeft, Loader2, CheckCheck, Lock, Flag } from 'lucide-react'; 
import { supabase } from '../../supabase';
import { useChat } from '../../hooks/useChat'; // ✅ Ensure this path is correct
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';     
import Input from '../ui/Input';     

const ChatSystem = ({ user, activeChat, setActiveChat, initialMessage = "" }) => {
  const scrollRef = useRef(null);
  const textareaRef = useRef(null); 
  const lastSentRef = useRef(0); 

  const [reportModalOpen, setReportModalOpen] = useState(false); 
  const [isSending, setIsSending] = useState(false); 

  const { messages, input, setInput, loading, myId, executeSendMessage } = useChat(activeChat, user, initialMessage);

  // --- QUICK REPLIES ---
  const isClient = user?.type === 'client';
  const quickReplies = isClient ? [
      "Looks great, thank you!", "Could we make a minor adjustment?", "Approved. I will release the payment."
  ] : [
      "I'll get started on this right away.", "Could you please clarify this requirement?", "The revision is ready."
  ];

  const handleQuickReplyClick = (reply) => {
      setInput(prev => prev ? `${prev} ${reply}` : reply);
      setTimeout(adjustTextareaHeight, 0); 
  };

  // --- ADVANCED SECURITY FILTERS ---
  const normalize = (text) => text.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9@+]/g, '');
  
  const containsContactDetails = (text) => {
    const clean = normalize(text);
    const patterns = [
      /(\+?\d{10,13})/, 
      /(whatsapp|wa\.me)/,
      /(telegram|t\.me)/,
      /(gmail|yahoo|outlook)/,
      /instagram|insta/,
      /@/
    ];
    return patterns.some(p => p.test(clean));
  };

  // --- AUTO-RESIZE TEXTAREA ---
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  // AUTO SCROLL
  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // --- BULLETPROOF SEND LOGIC ---
  const handleSend = async (e) => {
      e.preventDefault();
      
      if (!input.trim() || isSending) return;

      // Rate Limiting (Prevent DB Flood)
      const now = Date.now();
      if (now - lastSentRef.current < 1000) return; 
      lastSentRef.current = now;

      // Strict Frontend Contact Block
      if (containsContactDetails(input)) {
          alert("Sharing contact details (phone, email, WhatsApp) is strictly prohibited to protect both parties.");
          return;
      }

      setIsSending(true);
      const success = await executeSendMessage();
      
      if (success) {
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
      setIsSending(false);
  };

  // --- STRICT REPORT VALIDATION ---
  const handleReportUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const reason = formData.get('reason');
    const details = formData.get('details');

    if (!reason) { alert("Please select a reason for reporting."); return; }
    if (!details || details.trim().length < 10) { alert("Please provide at least 10 characters explaining the issue."); return; }

    const { error } = await supabase.from('reports').insert([{
        reporter_id: myId,
        reported_user_id: activeChat?.id,
        target_id: activeChat?.application_id,
        target_type: 'chat_violation',
        reason: reason,
        details: details
    }]);

    if (error) alert("Failed: " + error.message); 
    else { alert("User reported. Our Trust & Safety team will review this."); setReportModalOpen(false); }
  };

  if (!activeChat) return null;

  return (
    <div className="flex w-full h-full bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden relative font-sans flex-col rounded-2xl md:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex-none px-4 py-3 z-40 flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 shadow-sm transition-colors duration-300">
          <button onClick={() => setActiveChat(null)} className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft size={18}/>
          </button>
          
          <div className="flex-1">
              <h3 className="font-bold text-[15px] leading-tight tracking-wide">{activeChat?.name}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <Lock size={10} className="text-emerald-500" /> Escrow Chat: {activeChat?.application_id?.toString().slice(0,8)}
              </p>
          </div>

          <button onClick={() => setReportModalOpen(true)} className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-full transition-all active:scale-95">
              <Flag size={12} className="text-red-500 dark:text-red-400" />
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 hidden sm:block uppercase tracking-wider">Report</span>
          </button>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth custom-scrollbar relative bg-gray-50/50 dark:bg-[#0a0a0a] transition-colors duration-300">
        {loading ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400 dark:text-gray-600"/></div>
        ) : (
            <>
                <div className="text-center py-8 opacity-60 dark:opacity-40">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded-full mx-auto flex items-center justify-center mb-3">
                        <Lock size={18} className="text-gray-500 dark:text-gray-400"/>
                    </div>
                    <p className="text-xs px-8 leading-relaxed text-gray-600 dark:text-gray-300">Secure, encrypted chat with <span className="font-bold text-gray-900 dark:text-white">{activeChat?.name}</span>.<br/>Do not share external contact information.</p>
                </div>

                {messages.map((msg, index) => {
                const isMe = msg.sender_id === myId;
                
                return (
                    <div key={msg.id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-[14px] shadow-sm relative transition-all
                        ${isMe 
                            ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-[22px] rounded-br-[4px] border border-white/10 shadow-purple-900/20' 
                            : 'bg-white dark:bg-[#262626] text-gray-800 dark:text-gray-100 rounded-[22px] rounded-bl-[4px] border border-gray-200 dark:border-gray-800/80 shadow-sm'
                        }
                        ${msg.status === 'sending' ? 'opacity-70' : 'opacity-100'}
                        `}>
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        
                        <div className={`text-[10px] mt-1.5 flex items-center gap-1 justify-end font-medium tracking-wide
                            ${isMe ? 'text-white/70' : 'text-gray-400 dark:text-gray-400'}`}>
                            {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            
                            {isMe && (
                                msg.status === 'sending' ? <Loader2 size={12} className="animate-spin text-white/70"/> 
                                : <CheckCheck size={14} className="text-white/90"/>
                            )}
                        </div>
                        </div>
                    </div>
                );
                })}
                <div ref={scrollRef}></div>
            </>
        )}
      </div>

      {/* QUICK REPLIES & INPUT BAR */}
      <div className="flex-none p-3 bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-gray-800/80 z-30 flex flex-col gap-2 transition-colors duration-300">
        
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar items-center">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">Quick Reply:</span>
            {quickReplies.map((reply, index) => (
                <button
                    key={index}
                    onClick={() => handleQuickReplyClick(reply)}
                    className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-[11px] rounded-full transition-colors border border-gray-200 dark:border-gray-700 shrink-0"
                >
                    {reply}
                </button>
            ))}
        </div>

        <div className="relative flex items-end gap-2 max-w-4xl mx-auto w-full">
          <textarea 
              ref={textareaRef} 
              value={input} 
              onChange={handleInput} 
              placeholder="Message..." 
              rows={1}
              className="flex-1 bg-gray-100 dark:bg-[#262626] border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white rounded-[24px] py-3 px-5 focus:outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#333333] transition-all resize-none overflow-y-auto min-h-[48px] text-[15px] custom-scrollbar" 
              style={{ maxHeight: '120px' }}
          />
          
          <button 
              onClick={handleSend}
              disabled={!input.trim() || isSending} 
              className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none shrink-0"
          >
              {isSending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} className="ml-0.5" />}
          </button>
        </div>
      </div>

      {/* REPORT MODAL */}
      {reportModalOpen && (
          <Modal title="Report Message" onClose={() => setReportModalOpen(false)}>
              <form onSubmit={handleReportUser} className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-200 dark:border-red-500/20">All reports are reviewed by our trust and safety team. False reports may result in account bans.</div>
                  <Input name="reason" type="select" options={["Asking for payment outside platform", "Harassment", "Spam", "Other"]} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white"/>
                  <Input name="details" type="textarea" placeholder="Please provide specific context..." className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white min-h-[100px]"/>
                  <div className="flex gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setReportModalOpen(false)} className="w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</Button>
                      <Button className="w-full bg-red-600 hover:bg-red-500 text-white shadow-lg">Submit Report</Button>
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