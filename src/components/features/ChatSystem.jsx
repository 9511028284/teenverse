import React, { useRef, useEffect, useState } from 'react';
import { Send, ArrowLeft, Loader2, CheckCheck, Lock, Flag, MessageSquare, Rocket, Briefcase, Wifi, WifiOff, ShieldAlert } from 'lucide-react'; 
import { supabase } from '../../supabase';
import { useChat } from '../../hooks/useChat'; 
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';     
import Input from '../ui/Input'; 

// ==========================================
// 🛡️ ENTERPRISE PII SHIELD
// ==========================================
const containsContactDetails = (text) => {
    if (!text) return false;
    
    // Aggressive normalization to catch obfuscated attempts (e.g., "i n s t a")
    const normalized = text.toLowerCase().replace(/[\s\-_.]+/g, '');
    
    // 1. Phone Numbers (Catches any 7+ digits, even spaced out)
    const phoneRegex = /(?:\d[\s-._]*){7,15}/;
    
    // 2. Emails (Catches exact, [at], (at), dot com, etc)
    const emailRegex = /[a-z0-9._%+-]+(?:@|\[at\]|\(at\)|\s+at\s+)[a-z0-9.-]+(?:\.|\[dot\]|\(dot\)|\s+dot\s+)[a-z]{2,}/i;
    
    // 3. Links & Domains
    const urlRegex = /(https?:\/\/|www\.)[^\s]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i;
    
    // 4. Banned Platforms
    const socialRegex = /(instagram|insta|ig|whatsapp|wa|telegram|tg|discord|snapchat|snap|skype|twitter|x|linkedin|facebook|fb|wechat|viber|zoom|meet|teams)/i;

    return phoneRegex.test(text) || emailRegex.test(text) || urlRegex.test(text) || socialRegex.test(text) || socialRegex.test(normalized);
};

// ==========================================
// 💳 CASHFREE PAYMENT HELPER
// ==========================================
const processCashfreePayment = async (params, onSuccess, onFail) => {
  const cashfree = new window.Cashfree({ mode: "production" }); 

  try {
    const { data: orderData, error: orderError } = await supabase.functions.invoke('payment-gateway', {
      body: { 
        action: 'CREATE_ORDER',
        amount: params.amount,
        customerPhone: params.customerPhone,
        freelancerId: params.freelancerId,
        appId: params.appId,
        userId: params.userId
      }
    });

    if (orderError || !orderData?.payment_session_id) throw new Error("Order creation failed.");

    await cashfree.checkout({ paymentSessionId: orderData.payment_session_id, redirectTarget: "_modal" });

    const { data: verifyData } = await supabase.functions.invoke('payment-gateway', {
      body: { action: 'VERIFY_ORDER', orderId: orderData.order_id, appId: params.appId }
    });

    if (verifyData?.success) onSuccess(verifyData);
    else onFail("Payment not completed or failed.");

  } catch (err) {
    onFail(err.message || "Payment processing error.");
  }
};

// ==========================================
// 💬 MAIN CHAT COMPONENT
// ==========================================
const ChatSystem = ({ user, activeChat, setActiveChat, initialMessage = "", onAction, showToast }) => {
  const scrollRef = useRef(null);
  const textareaRef = useRef(null); 
  const lastSentRef = useRef(0); 

  const [reportModalOpen, setReportModalOpen] = useState(false); 
  const [hireModalOpen, setHireModalOpen] = useState(false); 
  const [isSending, setIsSending] = useState(false); 
  
  const [conversations, setConversations] = useState([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  // 🚀 Added isConnected and passed showToast into the hook
  const { messages, input, setInput, loading: chatLoading, myId, executeSendMessage, isConnected } = useChat(activeChat, user, initialMessage, showToast);
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

        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select(`id, ${otherIdColumn}, ${otherNameColumn}, created_at, status`) 
          .eq(roleColumn, user.id)
          .order('created_at', { ascending: false }); 

        if (appError) throw appError;

        let combinedChats = [];

        if (appData) {
          combinedChats = appData.map(app => ({
            id: app[otherIdColumn], 
            name: app[otherNameColumn],
            application_id: app.id,
            status: app.status,
            lastMessage: `Project Status: ${app.status}`,
            timestamp: new Date(app.created_at).getTime()
          }));
        }

        const { data: directMsgs, error: msgError } = await supabase
          .from('messages')
          .select('sender_id, receiver_id, content, created_at')
          .is('application_id', null)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (msgError) throw msgError;

        if (directMsgs && directMsgs.length > 0) {
           const directMap = new Map();
           directMsgs.forEach(msg => {
              const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
              if (!directMap.has(otherId)) {
                 directMap.set(otherId, {
                    id: otherId,
                    name: "Loading...", 
                    application_id: null,
                    lastMessage: msg.content?.includes('[SYSTEM') ? 'System Message' : (msg.content?.substring(0, 30) || '') + '...',
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
        if (showToast) showToast("Failed to sync inbox.", "error");
      } finally {
        setIsLoadingInbox(false);
      }
    };
    fetchConversations();
  }, [activeChat, user?.id, isClient, showToast]);

  // ==========================================
  // 🔒 SMART CHAT LOCK LOGIC
  // ==========================================
  let isChatLocked = false;
  let lockReason = "";

  if (activeChat) {
      const relatedApps = conversations.filter(c => c.id === activeChat.id && c.application_id);
      
      const hasActiveApp = relatedApps.some(c => ['Pending', 'Accepted', 'Submitted', 'Processing', 'Revision Requested'].includes(c.status));
      const hasCompletedApp = relatedApps.some(c => ['Paid', 'Completed'].includes(c.status));

      if (isDirect) {
          if (hasActiveApp) {
              isChatLocked = true;
              lockReason = "Active project exists. Please switch to the Secure Project Chat.";
          } else if (hasCompletedApp) {
              isChatLocked = true;
              lockReason = "Project completed. Chat securely archived.";
          }
      } else {
          const currentAppStatus = activeChat.status || relatedApps.find(c => c.application_id === activeChat.application_id)?.status;
          if (currentAppStatus && ['Paid', 'Completed', 'Rejected', 'Cancelled'].includes(currentAppStatus)) {
              isChatLocked = true;
              lockReason = `Project is ${currentAppStatus}. Chat securely archived.`;
          }
      }
  }

  const quickReplies = isClient ? [
      "Looks great, thank you!", "Could we make a minor adjustment?", "Approved. I will release the payment."
  ] : [
      "I'll get started on this right away.", "Could you please clarify this requirement?", "The revision is ready."
  ];

  const sendSystemMessage = async (sysMsg) => {
    const dbPayload = {
        application_id: isDirect ? null : activeChat.application_id, 
        sender_id: myId,
        receiver_id: activeChat.id, 
        content: sysMsg
    };
    await supabase.from('messages').insert([dbPayload]);
  };

  const handleDirectHire = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const amount = formData.get('amount');

    if (!user?.phone) {
      if (showToast) showToast("Please add a phone number to your profile to proceed.", "error");
      return;
    }

    setIsSending(true);
    try {
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

        await processCashfreePayment({
          amount: amount, customerPhone: user.phone, freelancerId: activeChat.id, appId: app.id, userId: myId
        }, 
        async () => {
          await sendSystemMessage(`[SYSTEM_ACTION:HIRED] Let's start! ₹${amount} Escrow Secured.`);
          setActiveChat({ ...activeChat, application_id: app.id, status: 'Accepted' });
          setHireModalOpen(false);
          setIsSending(false);
        },
        (errorMsg) => {
          if (showToast) showToast(errorMsg, "error");
          setIsSending(false);
        });
    } catch (err) {
        if (showToast) showToast("Escrow initialization failed.", "error");
        setIsSending(false);
    }
  };

  // 🚀 SECURE SEND HANDLER
  const handleSend = async (e) => {
      e.preventDefault();
      
      if (!isConnected) {
          if (showToast) showToast("Cannot send. Reconnecting to secure server...", "error");
          return;
      }
      
      if (!input.trim() || isSending || isChatLocked) return;

      const now = Date.now();
      if (now - lastSentRef.current < 1000) return; 
      lastSentRef.current = now;

      // 🛡️ FRONTEND PII INTERCEPTOR
      if (containsContactDetails(input)) {
          if (showToast) showToast("Message blocked. Sharing external contact info, links, or social media handles is strictly prohibited.", "error");
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

    if (!reason || !details || details.trim().length < 10) { 
        if (showToast) showToast("Please provide a valid reason and detailed description.", "error");
        return; 
    }

    const { error } = await supabase.from('reports').insert([{
        reporter_id: myId, reported_user_id: activeChat?.id, target_id: activeChat?.application_id || 'direct_message',
        target_type: 'chat_violation', reason: reason, details: details
    }]);

    if (error) {
        if (showToast) showToast("Failed to submit report.", "error");
    } else { 
        if (showToast) showToast("Report submitted successfully. Our trust & safety team will review it.", "success");
        setReportModalOpen(false); 
    }
  };

  /* =========================================================
     VIEW 1: INBOX LIST
     ========================================================= */
  if (!activeChat) {
    return (
      <div className="flex w-full h-full bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-white overflow-hidden relative font-sans flex-col rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-3">
               <MessageSquare className="text-indigo-600 dark:text-indigo-400" size={24}/>
               <h2 className="text-2xl font-black tracking-tight">Inbox</h2>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 dark:bg-transparent">
          {isLoadingInbox ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20 opacity-60">
               <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                   <MessageSquare size={24} className="text-gray-400"/>
               </div>
               <p className="font-bold text-lg mb-1 text-gray-900 dark:text-white">No active conversations</p>
               <p className="text-sm text-gray-500">Your secure messages will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {conversations.map(chat => (
                <li 
                  key={chat.application_id || chat.id} 
                  onClick={() => setActiveChat(chat)} 
                  className="p-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:shadow-md cursor-pointer transition-all group flex items-center justify-between"
                >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg border border-indigo-100 dark:border-indigo-800">
                        {chat.name ? chat.name.charAt(0) : '?'}
                     </div>
                     <div>
                       <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{chat.name || 'User'}</p>
                       <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-xs">{chat.lastMessage}</p>
                     </div>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      {chat.application_id ? (
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                             {['Paid', 'Completed', 'Cancelled', 'Rejected'].includes(chat.status) 
                                 ? <Lock size={12} className="text-gray-400"/> 
                                 : <ShieldAlert size={12} className="text-indigo-500"/>
                             } 
                             {['Paid', 'Completed'].includes(chat.status) ? 'Archived' : 'Active Project'}
                          </span>
                      ) : (
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <MessageSquare size={12} className="text-gray-400" /> Direct
                          </span>
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
    <div className="flex w-full h-full bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-white overflow-hidden relative font-sans flex-col rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl transition-colors duration-300">
      
      {/* 🚀 REAL-TIME CONNECTION BANNER */}
      {!isConnected && !chatLoading && (
          <div className="bg-amber-500 text-white text-[11px] font-bold text-center py-1.5 px-4 z-50 flex items-center justify-center gap-2 shadow-sm animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Connection interrupted. Reconnecting securely...
          </div>
      )}

      {/* HEADER */}
      <div className="flex-none px-4 py-3.5 z-40 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0B0F19] border-b border-gray-200 dark:border-white/10 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="w-9 h-9 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-transparent">
                  <ArrowLeft size={18}/>
              </button>
              
              <div>
                  <h3 className="font-bold text-[15px] leading-tight tracking-wide flex items-center gap-2">
                      {activeChat?.name}
                      {/* Connection Dot indicator */}
                      <div className="relative flex h-2 w-2" title={isConnected ? "Secure Connection Active" : "Reconnecting"}>
                        {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </div>
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                    {isDirect ? (
                        <>Pre-Hire Inquiry</>
                    ) : (
                        <><Lock size={10} className={isChatLocked ? "text-gray-400" : "text-indigo-500"} /> Project ID: {activeChat?.application_id?.toString().slice(0,8)}</>
                    )}
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-2">
              {isDirect && !isClient && !isChatLocked && (
                 <button onClick={() => sendSystemMessage('[SYSTEM_ACTION:REQUEST_HIRE]')} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all active:scale-95 shadow-sm">
                     <Rocket size={14} />
                     <span className="text-[11px] font-bold hidden sm:block uppercase tracking-wider">Request Setup</span>
                 </button>
              )}

              <button onClick={() => setReportModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/30 rounded-lg transition-all active:scale-95 text-red-600 dark:text-red-400">
                  <Flag size={12} />
                  <span className="text-[10px] font-bold hidden sm:block uppercase tracking-wider">Report</span>
              </button>
          </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth custom-scrollbar relative bg-gray-50/50 dark:bg-[#0B0F19] transition-colors duration-300">
        {chatLoading ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8"/></div>
        ) : (
            <>
                <div className="text-center py-6 opacity-80">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm">
                        {isDirect ? <MessageSquare size={18} className="text-gray-400"/> : <ShieldAlert size={18} className="text-indigo-500"/>}
                    </div>
                    <p className="text-xs px-8 leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
                        {isDirect ? "Direct Message Inquiry" : "Secure, encrypted channel" } with <span className="font-bold text-gray-900 dark:text-white">{activeChat?.name}</span>.<br/>Do not share external contact information. Escrow protects both parties.
                    </p>
                </div>

                {messages.map((msg, index) => {
                const isMe = msg.sender_id === myId;
                const safeContent = msg.content || ""; 
                
                if (safeContent === '[SYSTEM_ACTION:REQUEST_HIRE]') {
                    return (
                        <div key={msg.id || index} className="w-full flex justify-center my-8">
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-500/20 p-6 rounded-2xl text-center max-w-sm shadow-sm">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-5">
                                    {isMe ? "You sent a formal request to start the project." : `${activeChat.name} is ready to start the project!`}
                                </p>
                                {!isMe && isClient && !isChatLocked && (
                                    <Button onClick={() => setHireModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">
                                        Fund Escrow & Start
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                }
                
                if (safeContent.startsWith('[SYSTEM_ACTION:HIRED]')) {
                     return (
                         <div key={msg.id || index} className="w-full flex justify-center my-8">
                             <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-2xl text-center max-w-sm shadow-sm">
                                 <CheckCheck size={28} className="mx-auto text-emerald-600 mb-3" />
                                 <p className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">Project Officially Started</p>
                                 <p className="text-xs font-medium text-emerald-700 dark:text-emerald-500 mt-1.5">{safeContent.replace('[SYSTEM_ACTION:HIRED]', '')}</p>
                             </div>
                         </div>
                     );
                }
                
                return (
                    <div key={msg.id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 text-[14px] shadow-sm relative transition-all
                        ${isMe 
                            ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm border border-indigo-700 shadow-indigo-500/10' 
                            : 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-sm border border-gray-200 dark:border-white/5'
                        }
                        ${msg.status === 'sending' ? 'opacity-60' : 'opacity-100'}
                        `}>
                        
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{safeContent}</p>
                        
                        <div className={`text-[10px] mt-2 flex items-center gap-1 font-semibold tracking-wider
                            ${isMe ? 'justify-end text-indigo-200' : 'justify-start text-gray-400'}`}>
                            {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            {isMe && (msg.status === 'sending' ? <Loader2 size={12} className="animate-spin text-indigo-200"/> : <CheckCheck size={14} className="text-indigo-200"/>)}
                        </div>
                        </div>
                    </div>
                );
                })}
                <div ref={scrollRef}></div>
            </>
        )}
      </div>

      {/* INPUT BAR OR LOCK MESSAGE */}
      {isChatLocked ? (
        <div className="flex-none p-4 bg-gray-50 dark:bg-[#0F172A] border-t border-gray-200 dark:border-white/10 flex justify-center transition-colors duration-300">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold shadow-inner">
                <Lock size={14} className={isDirect ? "text-amber-500" : "text-gray-500"} /> {lockReason}
            </div>
        </div>
      ) : (
        <div className="flex-none p-3 bg-white dark:bg-[#0B0F19] border-t border-gray-200 dark:border-white/10 z-30 flex flex-col gap-2 transition-colors duration-300 relative">
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar items-center">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">Quick Reply:</span>
                {quickReplies.map((reply, index) => (
                    <button key={index} onClick={() => handleQuickReplyClick(reply)} disabled={!isConnected} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] rounded-lg transition-colors border border-gray-200 dark:border-gray-700 shrink-0 disabled:opacity-50">
                        {reply}
                    </button>
                ))}
            </div>

            <div className="relative flex items-end gap-2 max-w-4xl mx-auto w-full">
            <textarea 
                ref={textareaRef} 
                value={input} 
                onChange={handleInput} 
                disabled={!isConnected || isSending || isChatLocked}
                placeholder={!isConnected ? "Connecting to secure server..." : "Type a message..."} 
                rows={1}
                className="flex-1 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-[20px] py-3.5 px-5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none overflow-y-auto min-h-[50px] text-[14px] custom-scrollbar disabled:opacity-70" 
                style={{ maxHeight: '120px' }}
            />
            <button 
               onClick={handleSend} 
               disabled={!input.trim() || isSending || !isConnected} 
               className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none shrink-0"
            >
                {isSending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} className="ml-0.5" />}
            </button>
            </div>
        </div>
      )}

      {/* DIRECT HIRE MODAL */}
      {hireModalOpen && (
          <Modal title="Fund Escrow & Start" onClose={() => setHireModalOpen(false)}>
              <form onSubmit={handleDirectHire} className="space-y-4">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 p-4 rounded-xl text-sm border border-indigo-200 dark:border-indigo-500/20 flex items-start gap-3">
                      <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                      <p>You are about to hire <strong>{activeChat.name}</strong>. Funds will be held securely in escrow and only released when you approve the final work.</p>
                  </div>
                  <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Project Title</label>
                      <Input name="title" type="text" placeholder="e.g. Graphic Design Assets" required className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"/>
                  </div>
                  <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Agreed Amount (₹)</label>
                      <Input name="amount" type="number" placeholder="500" min="50" required className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"/>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button variant="outline" type="button" onClick={() => setHireModalOpen(false)} className="w-full">Cancel</Button>
                      <Button type="submit" disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                          {isSending ? <Loader2 size={16} className="animate-spin mx-auto"/> : "Fund Escrow & Pay"}
                      </Button>
                  </div>
              </form>
          </Modal>
      )}

      {/* REPORT MODAL */}
      {reportModalOpen && (
          <Modal title="Report Violation" onClose={() => setReportModalOpen(false)}>
              <form onSubmit={handleReportUser} className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-200 dark:border-red-500/20 font-medium">
                      Reports are strictly confidential and reviewed by our Trust & Safety team within 24 hours.
                  </div>
                  <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Reason for report</label>
                      <Input name="reason" type="select" options={["Attempting to bypass platform/escrow", "Harassment or abuse", "Spam", "Other"]} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"/>
                  </div>
                  <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Detailed Context</label>
                      <Input name="details" type="textarea" placeholder="Please provide specific context to help our investigation..." className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 min-h-[100px]"/>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button variant="outline" onClick={() => setReportModalOpen(false)} className="w-full">Cancel</Button>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg">Submit Report</Button>
                  </div>
              </form>
          </Modal>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar{display:none;} .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}} />
    </div>
  );
};

export default ChatSystem;