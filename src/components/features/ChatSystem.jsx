import React, { useRef, useEffect, useState } from 'react';
import { Send, ArrowLeft, Loader2, CheckCheck, Lock, Flag, MessageSquare, Rocket, Briefcase } from 'lucide-react'; 
import { supabase } from '../../supabase';
import { useChat } from '../../hooks/useChat'; 
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';     
import Input from '../ui/Input'; 

// ==========================================
// 💳 CASHFREE PAYMENT HELPER
// ==========================================
const processCashfreePayment = async (params, onSuccess, onFail) => {
  // Ensure you are loading the Cashfree SDK in your index.html
  const cashfree = new window.Cashfree({ mode: "production" }); 

  try {
    // 1. Call Edge Function to CREATE ORDER
    const { data: orderData, error: orderError } = await supabase.functions.invoke('cashfree-payment', {
      body: { 
        action: 'CREATE_ORDER',
        amount: params.amount,
        customerPhone: params.customerPhone,
        freelancerId: params.freelancerId,
        appId: params.appId,
        userId: params.userId
      }
    });

    if (orderError || !orderData?.payment_session_id) {
        throw new Error("Order creation failed. Check Edge Function logs.");
    }

    // 2. Open Cashfree Modal
    await cashfree.checkout({
      paymentSessionId: orderData.payment_session_id,
      redirectTarget: "_modal" 
    });

    // 3. Verify the payment after the modal closes
    const { data: verifyData } = await supabase.functions.invoke('cashfree-payment', {
      body: { 
        action: 'VERIFY_ORDER',
        orderId: orderData.order_id,
        appId: params.appId
      }
    });

    if (verifyData?.success) {
      onSuccess(verifyData);
    } else {
      onFail("Payment not completed or failed.");
    }

  } catch (err) {
    console.error(err);
    onFail(err.message);
  }
};

// ==========================================
// 💬 MAIN CHAT COMPONENT
// ==========================================
const ChatSystem = ({ user, activeChat, setActiveChat, initialMessage = "" }) => {
  const scrollRef = useRef(null);
  const textareaRef = useRef(null); 
  const lastSentRef = useRef(0); 

  const [reportModalOpen, setReportModalOpen] = useState(false); 
  const [hireModalOpen, setHireModalOpen] = useState(false); 
  const [isSending, setIsSending] = useState(false); 
  
  const [conversations, setConversations] = useState([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  const { messages, input, setInput, loading: chatLoading, myId, executeSendMessage } = useChat(activeChat, user, initialMessage);

  const isClient = user?.type === 'client';
  const isUuid = (val) => typeof val === 'string' && val.includes('-');
  const isDirect = !activeChat?.application_id || isUuid(activeChat?.application_id);

  // --- 🛠️ TEXT INPUT HANDLERS ---
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

  const handleQuickReplyClick = (reply) => {
      setInput(prev => prev ? `${prev} ${reply}` : reply);
      setTimeout(adjustTextareaHeight, 0); 
  };

  useEffect(() => { 
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // --- FETCH INBOX CONVERSATIONS ---
  useEffect(() => {
    if (activeChat || !user?.id) return; 

    const fetchConversations = async () => {
      setIsLoadingInbox(true);
      try {
        const roleColumn = isClient ? 'client_id' : 'freelancer_id';
        const otherNameColumn = isClient ? 'freelancer_name' : 'client_name';
        const otherIdColumn = isClient ? 'freelancer_id' : 'client_id';

        const { data: appData } = await supabase
          .from('applications')
          .select(`id, ${otherIdColumn}, ${otherNameColumn}, created_at, status`) 
          .eq(roleColumn, user.id)
          .order('created_at', { ascending: false }); 

        let combinedChats = [];

        if (appData) {
          combinedChats = appData.map(app => ({
            id: app[otherIdColumn], 
            name: app[otherNameColumn],
            application_id: app.id,
            lastMessage: `Project Status: ${app.status}`,
            timestamp: new Date(app.created_at).getTime()
          }));
        }

        const { data: directMsgs } = await supabase
          .from('messages')
          .select('sender_id, receiver_id, content, created_at')
          .is('application_id', null)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (directMsgs && directMsgs.length > 0) {
           const directMap = new Map();
           directMsgs.forEach(msg => {
              const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
              if (!directMap.has(otherId)) {
                 directMap.set(otherId, {
                    id: otherId,
                    name: "Loading...", 
                    application_id: null,
                    lastMessage: msg.content.includes('[SYSTEM') ? 'System Message' : msg.content.substring(0, 30) + '...',
                    timestamp: new Date(msg.created_at).getTime()
                 });
              }
           });

           const uniqueIds = Array.from(directMap.keys());
           if (uniqueIds.length > 0) {
               const [{ data: fData }, { data: cData }] = await Promise.all([
                   supabase.from('freelancers').select('id, name').in('id', uniqueIds),
                   supabase.from('clients').select('id, name').in('id', uniqueIds)
               ]);

               const nameMap = {};
               if (fData) fData.forEach(f => nameMap[f.id] = f.name);
               if (cData) cData.forEach(c => nameMap[c.id] = c.name);

               Array.from(directMap.values()).forEach(chat => {
                  chat.name = nameMap[chat.id] || 'Unknown User';
                  combinedChats.push(chat);
               });
           }
        }

        combinedChats.sort((a, b) => b.timestamp - a.timestamp);
        const uniqueChats = Array.from(new Map(combinedChats.map(item => [(item.application_id ? `app_${item.application_id}` : `dir_${item.id}`), item])).values());

        setConversations(uniqueChats);
      } catch (err) {
        console.error("Error loading inbox:", err);
      } finally {
        setIsLoadingInbox(false);
      }
    };
    fetchConversations();
  }, [activeChat, user?.id, isClient]);

  const quickReplies = isClient ? [
      "Looks great, thank you!", "Could we make a minor adjustment?", "Approved. I will release the payment."
  ] : [
      "I'll get started on this right away.", "Could you please clarify this requirement?", "The revision is ready."
  ];

  const normalize = (text) => text.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9@+]/g, '');
  const containsContactDetails = (text) => {
    const clean = normalize(text);
    const patterns = [
      /(\+?\d{10,13})/, /(whatsapp|wa\.me)/, /(telegram|t\.me)/,
      /(gmail|yahoo|outlook)/, /instagram|insta/, /@/
    ];
    return patterns.some(p => p.test(clean));
  };

  // --- SYSTEM MESSAGE INJECTOR ---
  const sendSystemMessage = async (sysMsg) => {
    const dbPayload = {
        application_id: isDirect ? null : activeChat.application_id, 
        sender_id: myId,
        receiver_id: activeChat.id, 
        content: sysMsg
    };
    await supabase.from('messages').insert([dbPayload]);
  };

  // --- 🚀 DIRECT HIRE LOGIC (CLIENT SIDE) ---
  const handleDirectHire = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const amount = formData.get('amount');

    if (!user?.phone) {
      alert("Please add a phone number to your profile to proceed with payment.");
      return;
    }

    setIsSending(true);
    try {
        // 1. Create the DRAFT Application
        const { data: job } = await supabase.from('jobs').insert({
            client_id: myId, client_name: user.name, title, budget: amount, 
            job_type: 'Fixed Price', category: 'Direct Hire', hired_freelancer_id: activeChat.id
        }).select().single();

        const { data: freelancer } = await supabase.from('freelancers').select('email').eq('id', activeChat.id).single();

        const { data: app } = await supabase.from('applications').insert({
            job_id: job.id, freelancer_id: activeChat.id, freelancer_name: activeChat.name,
            client_id: myId, bid_amount: amount, status: 'Pending', 
            freelancer_email: freelancer?.email || ''
        }).select().single();

        // 2. Trigger the Payment Helper
        await processCashfreePayment({
          amount: amount,
          customerPhone: user.phone,
          freelancerId: activeChat.id,
          appId: app.id,
          userId: myId
        }, 
        async (verifyData) => {
          // SUCCESS CALLBACK
          await sendSystemMessage(`[SYSTEM_ACTION:HIRED] Let's start! ₹${amount} Escrow Secured.`);
          setActiveChat({ ...activeChat, application_id: app.id });
          setHireModalOpen(false);
          setIsSending(false);
        },
        (errorMsg) => {
          // FAIL CALLBACK
          alert(errorMsg);
          setIsSending(false);
        });
        
    } catch (err) {
        alert("Failed: " + err.message);
        setIsSending(false);
    }
  };

  const handleSend = async (e) => {
      e.preventDefault();
      if (!input.trim() || isSending) return;

      const now = Date.now();
      if (now - lastSentRef.current < 1000) return; 
      lastSentRef.current = now;

      if (containsContactDetails(input)) {
          alert("Sharing contact details is strictly prohibited to protect both parties.");
          return;
      }

      setIsSending(true);
      const success = await executeSendMessage();
      if (success && textareaRef.current) textareaRef.current.style.height = 'auto';
      setIsSending(false);
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const reason = formData.get('reason');
    const details = formData.get('details');

    if (!reason || !details || details.trim().length < 10) { alert("Please provide a valid reason and description."); return; }

    const { error } = await supabase.from('reports').insert([{
        reporter_id: myId, reported_user_id: activeChat?.id, target_id: activeChat?.application_id || 'direct_message',
        target_type: 'chat_violation', reason: reason, details: details
    }]);

    if (error) alert("Failed: " + error.message); 
    else { alert("User reported."); setReportModalOpen(false); }
  };

  /* =========================================================
     VIEW 1: INBOX LIST
     ========================================================= */
  if (!activeChat) {
    return (
      <div className="flex w-full h-full bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden relative font-sans flex-col rounded-2xl md:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-3">
           <MessageSquare className="text-indigo-500" size={24}/>
           <h2 className="text-2xl font-black tracking-tight">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 dark:bg-transparent">
          {isLoadingInbox ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20 opacity-50">
               <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare size={24} className="text-gray-400"/></div>
               <p className="font-medium text-lg mb-1">No messages yet</p>
               <p className="text-sm">Apply for jobs or hire talent to start chatting.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map(chat => (
                <li 
                  key={chat.application_id || chat.id} 
                  onClick={() => setActiveChat(chat)} 
                  className="p-4 bg-white dark:bg-[#111111] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-indigo-500/30 hover:shadow-md cursor-pointer transition-all group flex items-center justify-between"
                >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                        {chat.name ? chat.name.charAt(0) : '?'}
                     </div>
                     <div>
                       <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">{chat.name || 'User'}</p>
                       <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-xs">{chat.lastMessage}</p>
                     </div>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      {chat.application_id ? (
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1"><Lock size={10} className="text-emerald-500"/> Escrow Secure</span>
                      ) : (
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">Direct Message</span>
                      )}
                   </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     VIEW 2: ACTIVE CHAT WINDOW
     ========================================================= */
  return (
    <div className="flex w-full h-full bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden relative font-sans flex-col rounded-2xl md:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex-none px-4 py-3 z-40 flex flex-wrap items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 shadow-sm transition-colors duration-300">
          <button onClick={() => setActiveChat(null)} className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft size={18}/>
          </button>
          
          <div className="flex-1 min-w-[150px]">
              <h3 className="font-bold text-[15px] leading-tight tracking-wide">{activeChat?.name}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                {isDirect ? (
                    <>Pre-Hire Inquiry</>
                ) : (
                    <><Lock size={10} className="text-emerald-500" /> Escrow Chat: {activeChat?.application_id?.toString().slice(0,8)}</>
                )}
              </p>
          </div>

          {/* THE FREELANCER "REQUEST PROJECT" BUTTON */}
          {isDirect && !isClient && (
             <button onClick={() => sendSystemMessage('[SYSTEM_ACTION:REQUEST_HIRE]')} className="group relative flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all active:scale-95 shadow-md shadow-indigo-500/20">
                 <Rocket size={14} />
                 <span className="text-[11px] font-bold hidden sm:block uppercase tracking-wider">Start Project</span>
             </button>
          )}

          <button onClick={() => setReportModalOpen(true)} className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-full transition-all active:scale-95">
              <Flag size={12} className="text-red-500 dark:text-red-400" />
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 hidden sm:block uppercase tracking-wider">Report</span>
          </button>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth custom-scrollbar relative bg-gray-50/50 dark:bg-[#0a0a0a] transition-colors duration-300">
        {chatLoading ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400 dark:text-gray-600"/></div>
        ) : (
            <>
                <div className="text-center py-8 opacity-60 dark:opacity-40">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded-full mx-auto flex items-center justify-center mb-3">
                        {isDirect ? <MessageSquare size={18} className="text-gray-500"/> : <Lock size={18} className="text-gray-500 dark:text-gray-400"/>}
                    </div>
                    <p className="text-xs px-8 leading-relaxed text-gray-600 dark:text-gray-300">
                        {isDirect ? "Direct Message Inquiry" : "Secure, encrypted chat" } with <span className="font-bold text-gray-900 dark:text-white">{activeChat?.name}</span>.<br/>Do not share external contact information.
                    </p>
                </div>

                {messages.map((msg, index) => {
                const isMe = msg.sender_id === myId;
                
                if (msg.content === '[SYSTEM_ACTION:REQUEST_HIRE]') {
                    return (
                        <div key={msg.id || index} className="w-full flex justify-center my-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 p-5 rounded-2xl text-center max-w-sm shadow-sm">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-4">
                                    {isMe ? "You sent a formal request to start the project." : `${activeChat.name} is ready to start the project!`}
                                </p>
                                {!isMe && isClient && (
                                    <Button onClick={() => setHireModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                                        Set Up Project & Pay
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                }
                
                if (msg.content.startsWith('[SYSTEM_ACTION:HIRED]')) {
                     return (
                         <div key={msg.id || index} className="w-full flex justify-center my-6">
                             <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-2xl text-center max-w-sm shadow-sm">
                                 <CheckCheck size={24} className="mx-auto text-emerald-500 mb-2" />
                                 <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Project Officially Started!</p>
                                 <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{msg.content.replace('[SYSTEM_ACTION:HIRED]', '')}</p>
                             </div>
                         </div>
                     );
                }
                
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
                                msg.status === 'sending' ? <Loader2 size={12} className="animate-spin text-white/70"/> : <CheckCheck size={14} className="text-white/90"/>
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

      {/* INPUT BAR */}
      <div className="flex-none p-3 bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-gray-800/80 z-30 flex flex-col gap-2 transition-colors duration-300">
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar items-center">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">Quick Reply:</span>
            {quickReplies.map((reply, index) => (
                <button key={index} onClick={() => handleQuickReplyClick(reply)} className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-[11px] rounded-full transition-colors border border-gray-200 dark:border-gray-700 shrink-0">
                    {reply}
                </button>
            ))}
        </div>

        <div className="relative flex items-end gap-2 max-w-4xl mx-auto w-full">
          <textarea 
              ref={textareaRef} value={input} onChange={handleInput} placeholder="Message..." rows={1}
              className="flex-1 bg-gray-100 dark:bg-[#262626] border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white rounded-[24px] py-3 px-5 focus:outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#333333] transition-all resize-none overflow-y-auto min-h-[48px] text-[15px] custom-scrollbar" 
              style={{ maxHeight: '120px' }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isSending} className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none shrink-0">
              {isSending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} className="ml-0.5" />}
          </button>
        </div>
      </div>

      {/* NEW: DIRECT HIRE MODAL (CLIENTS ONLY) */}
      {hireModalOpen && (
          <Modal title="Setup Project & Pay" onClose={() => setHireModalOpen(false)}>
              <form onSubmit={handleDirectHire} className="space-y-4">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 p-4 rounded-xl text-sm border border-indigo-200 dark:border-indigo-500/20">
                      You are about to hire <strong>{activeChat.name}</strong>. Funds will be held securely in escrow until the work is approved.
                  </div>
                  <Input name="title" type="text" placeholder="Project Title (e.g. Logo Design)" required className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white"/>
                  <Input name="amount" type="number" placeholder="Agreed Amount (₹)" min="50" required className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white"/>
                  
                  <div className="flex gap-3 pt-2">
                      <Button variant="ghost" type="button" onClick={() => setHireModalOpen(false)} className="w-full text-gray-600 dark:text-gray-400">Cancel</Button>
                      <Button type="submit" disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                          {isSending ? <Loader2 size={16} className="animate-spin mx-auto"/> : "Create & Pay"}
                      </Button>
                  </div>
              </form>
          </Modal>
      )}

      {/* REPORT MODAL */}
      {reportModalOpen && (
          <Modal title="Report Message" onClose={() => setReportModalOpen(false)}>
              <form onSubmit={handleReportUser} className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-200 dark:border-red-500/20">Reports are reviewed by our trust and safety team.</div>
                  <Input name="reason" type="select" options={["Asking for payment outside platform", "Harassment", "Spam", "Other"]} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white"/>
                  <Input name="details" type="textarea" placeholder="Provide specific context..." className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white min-h-[100px]"/>
                  <div className="flex gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setReportModalOpen(false)} className="w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</Button>
                      <Button className="w-full bg-red-600 hover:bg-red-500 text-white shadow-lg">Submit Report</Button>
                  </div>
              </form>
          </Modal>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar{display:none;} .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}} />
    </div>
  );
};

export default ChatSystem;