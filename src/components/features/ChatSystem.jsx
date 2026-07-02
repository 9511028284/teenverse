import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, ArrowLeft, Loader2, CheckCheck, Lock, Flag, MessageSquare, 
  Rocket, Briefcase, ShieldAlert, Wallet, Search, MoreVertical, 
  Paperclip, Smile, ShieldCheck 
} from 'lucide-react'; 
import { supabase } from '../../supabase';
import { useChat } from '../../hooks/useChat'; 
import { fundEscrowWithWallet } from '../../services/dashboard.api';
import { createCashfreeCheckout } from '../../utils/cashfreeSdk';
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';     
import Input from '../ui/Input'; 

// ==========================================
// 🛡️ ENTERPRISE PII SHIELD
// ==========================================
const containsContactDetails = (text) => {
    if (!text) return false;
    const normalized = text.toLowerCase().replace(/[\s\-_.]+/g, '');
    const phoneRegex = /(?:\d[\s-._]*){7,15}/;
    const emailRegex = /[a-z0-9._%+-]+(?:@|\[at\]|\(at\)|\s+at\s+)[a-z0-9.-]+(?:\.|\[dot\]|\(dot\)|\s+dot\s+)[a-z]{2,}/i;
    const urlRegex = /(https?:\/\/|www\.)[^\s]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i;
    const socialRegex = /(instagram|insta|ig|whatsapp|wa|telegram|tg|discord|snapchat|snap|skype|twitter|x|linkedin|facebook|fb|wechat|viber|zoom|meet|teams)/i;

    return phoneRegex.test(text) || emailRegex.test(text) || urlRegex.test(text) || socialRegex.test(text) || socialRegex.test(normalized);
};

// ==========================================
// 💳 CASHFREE PAYMENT HELPER
// ==========================================
const processCashfreePayment = async (params, onSuccess, onFail) => {
  try {
    const cashfree = await createCashfreeCheckout();
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

    const createdOrderId = orderData?.order_id || orderData?.orderId;
    if (orderError || !orderData?.payment_session_id || !createdOrderId) throw new Error("Order creation failed.");

    await cashfree.checkout({ paymentSessionId: orderData.payment_session_id, redirectTarget: "_modal" });

    if (params.verifyWithPaymentGateway === false) {
      await onSuccess({ order_id: createdOrderId, orderId: createdOrderId });
      return;
    }

    const { data: verifyData } = await supabase.functions.invoke('payment-gateway', {
      body: { action: 'VERIFY_ORDER', orderId: createdOrderId, appId: params.appId }
    });

    if (verifyData?.success) {
      const verifiedOrderId = verifyData.order_id || verifyData.orderId || verifyData?.order?.order_id || createdOrderId;
      await onSuccess({ ...verifyData, order_id: verifiedOrderId, orderId: verifiedOrderId });
    }
    else onFail("Payment not completed or failed.");

  } catch (err) {
    onFail(err.message || "Payment processing error.");
  }
};

// ==========================================
// 💬 MAIN CHAT COMPONENT
// ==========================================
const ChatSystem = ({ user, activeChat, setActiveChat, initialMessage = "", showToast }) => {
  const scrollRef = useRef(null);
  const textareaRef = useRef(null); 
  const lastSentRef = useRef(0); 

  const [searchQuery, setSearchQuery] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false); 
  const [hireModalOpen, setHireModalOpen] = useState(false); 
  const [isSending, setIsSending] = useState(false); 
  const [hireAmount, setHireAmount] = useState("");
  const [useWalletForHire, setUseWalletForHire] = useState(false);
  
  const [conversations, setConversations] = useState([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  const { messages, input, setInput, loading: chatLoading, myId, executeSendMessage, isConnected } = useChat(activeChat, user, initialMessage, showToast);
  const isClient = user?.type === 'client';
  const isUuid = (val) => typeof val === 'string' && val.includes('-');
  const isDirect = !activeChat?.application_id || isUuid(activeChat?.application_id);
  const walletBalance = Number(user?.wallet_balance) || 0;
  const numericHireAmount = Number(hireAmount) || 0;
  const hireWalletDeduction = useWalletForHire ? Math.min(walletBalance, numericHireAmount) : 0;
  const hireFinalPayable = Math.max(0, numericHireAmount - hireWalletDeduction);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('teenverse:copilot-visibility', { detail: { hidden: true, source: 'messages' } }));

    return () => {
      window.dispatchEvent(new CustomEvent('teenverse:copilot-visibility', { detail: { hidden: false, source: 'messages' } }));
    };
  }, []);

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
    if (!user?.id) return; 

    const fetchConversations = async () => {
      setIsLoadingInbox(true);
      try {
        const roleColumn = isClient ? 'client_id' : 'freelancer_id';
        const otherIdColumn = isClient ? 'freelancer_id' : 'client_id';

        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select(`id, client_id, freelancer_id, freelancer_name, created_at, status, jobs(client_name)`) 
          .eq(roleColumn, user.id)
          .order('created_at', { ascending: false }); 

        if (appError) throw appError;

        let combinedChats = [];

        if (appData) {
          combinedChats = appData.map(app => ({
            id: app[otherIdColumn], 
            name: isClient ? app.freelancer_name : (app.jobs?.client_name || 'Client'),
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
                    lastMessage: msg.content?.includes('[SYSTEM') ? 'System Action Required' : (msg.content?.substring(0, 45) || '') + '...',
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
        console.error("Inbox Error:", err);
        if (showToast) showToast("Failed to sync inbox.", "error");
      } finally {
        setIsLoadingInbox(false);
      }
    };
    
    fetchConversations();
  }, [user?.id, isClient, showToast]);

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
              lockReason = "Active contract exists. Use Secure Project Chat.";
          } else if (hasCompletedApp) {
              isChatLocked = true;
              lockReason = "Project completed. Chat securely archived.";
          }
      } else {
          const currentAppStatus = activeChat.status || relatedApps.find(c => c.application_id === activeChat.application_id)?.status;
          if (currentAppStatus && ['Paid', 'Completed', 'Rejected', 'Cancelled'].includes(currentAppStatus)) {
              isChatLocked = true;
              lockReason = `Project is ${currentAppStatus}. Chat archived.`;
          }
      }
  }

  const quickReplies = isClient ? [
      "Looks great, thank you!", "Could we make a minor adjustment?", "Approved. Releasing payment now."
  ] : [
      "I'll get started right away.", "Could you clarify this metric?", "The revision is ready for review."
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

  const closeHireModal = () => {
    setHireModalOpen(false);
    setHireAmount("");
    setUseWalletForHire(false);
  };

  const completeDirectHire = async (app, amount, walletDeduction = 0) => {
    await sendSystemMessage(`[SYSTEM_ACTION:HIRED] Let's start! ₹${amount} Escrow Secured.`);
    setActiveChat({ ...activeChat, application_id: app.id, status: 'Accepted' });
    closeHireModal();
    setIsSending(false);

    if (showToast) {
      showToast(walletDeduction > 0 ? "Wallet payment confirmed! Escrow secured." : "Payment successful! Escrow secured.", "success");
    }
  };

  const handleDirectHire = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const amount = Number(formData.get('amount'));
    const walletDeduction = useWalletForHire ? Math.min(walletBalance, amount) : 0;
    const finalPayable = Math.max(0, amount - walletDeduction);

    if (!Number.isFinite(amount) || amount <= 0) {
      if (showToast) showToast("Please enter a valid project amount.", "error");
      return;
    }

    if (finalPayable > 0 && !user?.phone) {
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

        if (walletDeduction > 0 && finalPayable === 0) {
          const { data, error } = await fundEscrowWithWallet({
            appId: app.id,
            walletDeduction,
            gatewayAmount: 0
          });

          if (error || !data?.success) {
            throw new Error(error?.message || data?.error || "Wallet payment failed.");
          }

          await completeDirectHire(app, amount, walletDeduction);
          return;
        }

        await processCashfreePayment({
          amount: finalPayable,
          customerPhone: user.phone,
          freelancerId: activeChat.id,
          appId: app.id,
          userId: myId,
          verifyWithPaymentGateway: walletDeduction === 0
        }, 
        async (verifyData) => {
          if (walletDeduction > 0) {
            const { data, error } = await fundEscrowWithWallet({
              appId: app.id,
              walletDeduction,
              gatewayAmount: finalPayable,
              orderId: verifyData.order_id || verifyData.orderId
            });

            if (error || !data?.success) {
              throw new Error(error?.message || data?.error || "Wallet payment failed after gateway payment.");
            }
          }

          await completeDirectHire(app, amount, walletDeduction);
        },
        (errorMsg) => {
          if (showToast) showToast(errorMsg, "error");
          setIsSending(false);
        });
    } catch (_err) {
        if (showToast) showToast("Escrow initialization failed.", "error");
        setIsSending(false);
    }
  };

  const handleSend = async (e) => {
      e.preventDefault();
      if (!isConnected) {
          if (showToast) showToast("Reconnecting to secure servers...", "error");
          return;
      }
      if (!input.trim() || isSending || isChatLocked) return;

      const now = Date.now();
      if (now - lastSentRef.current < 1000) return; 
      lastSentRef.current = now;

      if (containsContactDetails(input)) {
          if (showToast) showToast("Sharing external contact info, URLs, or handles is strictly prohibited.", "error");
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
        if (showToast) showToast("Please provide a valid reason and detailed context.", "error");
        return; 
    }

    const { error } = await supabase.from('reports').insert([{
        reporter_id: myId, reported_user_id: activeChat?.id, target_id: activeChat?.application_id || 'direct_message',
        target_type: 'chat_violation', reason: reason, details: details
    }]);

    if (error) {
        if (showToast) showToast("Failed to submit report.", "error");
    } else { 
        if (showToast) showToast("Report logged. Our Trust & Safety team will review details.", "success");
        setReportModalOpen(false); 
    }
  };

  const filteredConversations = conversations.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-full min-h-[500px] md:h-[85vh] max-w-full bg-slate-50 dark:bg-[#090D16] rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/60 shadow-2xl overflow-hidden font-sans transition-colors duration-300">
      
      {/* ==========================================
         PANEL 1: SIDEBAR INBOX (RESPONSIVE)
         ========================================== */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-[#0F1524] border-r border-slate-200 dark:border-slate-800/80 shrink-0 transition-all duration-300 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Inbox Header */}
        <div className="p-4 flex flex-col gap-3.5 border-b border-slate-100 dark:border-slate-800/60">
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                     <MessageSquare size={18} />
                   </div>
                   <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Messages</h2>
               </div>
               <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">
                 {conversations.length}
               </span>
           </div>

           {/* Search Control */}
           <div className="relative flex items-center">
              <Search className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" size={14} />
              <input 
                type="text" 
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151C2C] text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2 rounded-xl border border-transparent focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              />
           </div>
        </div>

        {/* Conversation Track */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-slate-50/40 dark:bg-transparent">
          {isLoadingInbox ? (
            <div className="flex flex-col justify-center items-center h-48 gap-2">
              <Loader2 className="animate-spin text-indigo-500" size={20} />
              <p className="text-[11px] text-slate-400 font-medium animate-pulse">Syncing encrypted inbox...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16 px-4">
               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800/40 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-400">
                   <MessageSquare size={16}/>
               </div>
               <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">No conversations found</p>
               <p className="text-[11px] text-slate-400 mt-0.5">Your verified project messages live here.</p>
            </div>
          ) : (
            filteredConversations.map(chat => {
              const isSelected = activeChat?.application_id 
                ? chat.application_id === activeChat.application_id 
                : chat.id === activeChat?.id && !chat.application_id;

              return (
                <div 
                  key={chat.application_id ? `app_${chat.application_id}` : `dir_${chat.id}`} 
                  onClick={() => setActiveChat(chat)} 
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-200 group
                    ${isSelected 
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    }`}
                >
                   <div className="flex items-center gap-3 overflow-hidden">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 transition-transform group-hover:scale-105
                       ${isSelected 
                         ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10' 
                         : 'bg-slate-100 dark:bg-[#161D2E] text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-800'
                       }`}
                     >
                        {chat.name ? chat.name.charAt(0).toUpperCase() : '?'}
                     </div>
                     <div className="overflow-hidden">
                       <p className={`font-semibold text-xs truncate transition-colors ${isSelected ? 'text-indigo-950 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-200'}`}>
                         {chat.name || 'External Operator'}
                       </p>
                       <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[160px] mt-0.5 font-medium">
                         {chat.lastMessage}
                       </p>
                     </div>
                   </div>
                   <div className="text-right flex flex-col items-end shrink-0 pl-2">
                      {chat.application_id ? (
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1
                            ${['Paid', 'Completed'].includes(chat.status)
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                             {['Paid', 'Completed'].includes(chat.status) ? <Lock size={8}/> : <Briefcase size={8}/>} 
                             {['Paid', 'Completed'].includes(chat.status) ? 'Archived' : 'Contract'}
                          </span>
                      ) : (
                          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-500 rounded flex items-center gap-1">
                              <MessageSquare size={8} /> Direct
                          </span>
                      )}
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ==========================================
         PANEL 2: ACTIVE CHAT SCREEN (RESPONSIVE)
         ========================================== */}
      <div className={`flex-1 flex flex-col bg-[#FAFBFD] dark:bg-[#0B0F19] transition-all duration-300 max-w-full overflow-hidden ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        
        {activeChat ? (
          <>
            {/* Connection Warning Interceptor */}
            {!isConnected && !chatLoading && (
                <div className="bg-amber-500 text-white text-[11px] font-semibold text-center py-2 px-4 z-50 flex items-center justify-center gap-2 shadow-inner animate-pulse shrink-0">
                    <Loader2 size={13} className="animate-spin" /> Link degraded. Re-establishing secure handshake pipeline...
                </div>
            )}

            {/* Chat Screen Header */}
            <div className="flex-none px-4 py-3 z-40 flex items-center justify-between gap-4 bg-white dark:bg-[#0F1524] border-b border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3 overflow-hidden">
                    <button onClick={() => setActiveChat(null)} className="md:hidden w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 border border-slate-200 dark:border-transparent shrink-0">
                        <ArrowLeft size={16}/>
                    </button>
                    
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-200/40 dark:border-slate-700">
                        {activeChat?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-white dark:bg-[#0F1524] rounded-full flex items-center justify-center">
                        <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </div>
                    </div>

                    <div className="overflow-hidden">
                        <h3 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white tracking-wide truncate">
                            {activeChat?.name}
                        </h3>
                        <p className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-medium truncate">
                          {isDirect ? (
                              <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-teal-500" /> Presale Encrypted Channel</span>
                          ) : (
                              <span className="flex items-center gap-1 font-mono"><Lock size={10} className="text-indigo-500" /> contract_id:{activeChat?.application_id?.toString().slice(0,8)}</span>
                          )}
                        </p>
                    </div>
                </div>

                {/* Header Context Action Options */}
                <div className="flex items-center gap-2 shrink-0">
                    {isDirect && !isClient && !isChatLocked && (
                       <button onClick={() => sendSystemMessage('[SYSTEM_ACTION:REQUEST_HIRE]')} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-500/10">
                           <Rocket size={12} />
                           <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Request Escrow</span>
                       </button>
                    )}

                    <button onClick={() => setReportModalOpen(true)} className="p-2 bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/60 rounded-xl transition-colors" title="Report Violation">
                        <Flag size={12} />
                    </button>
                </div>
            </div>

            {/* Message Track Body */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 custom-scrollbar relative bg-[#FAFBFD] dark:bg-[#0B0F19] transition-colors duration-300">
              {chatLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAFBFD]/60 dark:bg-[#0B0F19]/60 backdrop-blur-sm z-10">
                    <Loader2 className="animate-spin text-indigo-500 w-6 h-6 mb-1.5"/>
                    <p className="text-[11px] text-slate-400 font-medium tracking-wide">Syncing message logs...</p>
                  </div>
              ) : (
                  <>
                      {/* Safety Rules Callout Banner */}
                      <div className="bg-white dark:bg-[#0F1524] border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl max-w-xl mx-auto text-center shadow-sm">
                          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 rounded-xl mx-auto flex items-center justify-center mb-2 text-indigo-500">
                              {isDirect ? <MessageSquare size={14}/> : <ShieldAlert size={14}/>}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              Secure end-to-end channel with <span className="font-bold text-slate-900 dark:text-white">{activeChat?.name}</span>.<br />
                              To safeguard payments, keep chat within the system interface. External links violate standard compliance.
                          </p>
                      </div>

                      {messages.map((msg, index) => {
                      const isMe = msg.sender_id === myId;
                      const safeContent = msg.content || ""; 
                      
                      if (safeContent === '[SYSTEM_ACTION:REQUEST_HIRE]') {
                          return (
                              <div key={msg.id || index} className="w-full flex justify-center my-4 animate-fadeIn">
                                  <div className="bg-gradient-to-b from-white to-slate-50 dark:from-[#0F1524] dark:to-[#131B2E] border border-indigo-100 dark:border-indigo-50/20 p-4 rounded-xl text-center max-w-xs shadow-md">
                                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/80 rounded-lg flex items-center justify-center mx-auto mb-2 text-indigo-600 dark:text-indigo-400">
                                          <Briefcase size={16} />
                                      </div>
                                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-3 leading-snug">
                                          {isMe ? "You requested technical escrow mobilization setup." : `${activeChat.name} initialized contract terms. Ready to trade!`}
                                      </p>
                                      {!isMe && isClient && !isChatLocked && (
                                          <Button onClick={() => setHireModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10 text-[10px] py-2 rounded-xl font-bold uppercase tracking-wider">
                                              Fund Escrow Order
                                          </Button>
                                      )}
                                  </div>
                              </div>
                          );
                      }
                      
                      if (safeContent.startsWith('[SYSTEM_ACTION:HIRED]')) {
                           return (
                               <div key={msg.id || index} className="w-full flex justify-center my-4 animate-fadeIn">
                                   <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-500/20 p-3.5 rounded-xl text-center max-w-xs shadow-sm">
                                       <div className="w-7 h-7 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center mb-2 shadow-sm shadow-emerald-500/20">
                                         <CheckCheck size={14} />
                                       </div>
                                       <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Escrow Vault Locked</p>
                                       <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{safeContent.replace('[SYSTEM_ACTION:HIRED]', '')}</p>
                                   </div>
                               </div>
                           );
                      }
                      
                      return (
                          <div key={msg.id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                              <div className={`max-w-[85%] sm:max-w-[70%] md:max-w-[60%] px-3.5 py-2.5 text-xs md:text-sm shadow-sm relative transition-all duration-150
                              ${isMe 
                                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-none shadow-indigo-500/5' 
                                  : 'bg-white dark:bg-[#0F1524] text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-none border border-slate-200/60 dark:border-slate-800/60'
                              }
                              ${msg.status === 'sending' ? 'opacity-60' : 'opacity-100'}
                              `}>
                              
                              <p className="leading-relaxed whitespace-pre-wrap break-words">{safeContent}</p>
                              
                              <div className={`text-[9px] mt-1 flex items-center gap-1 font-medium opacity-75 tracking-wide
                                  ${isMe ? 'justify-end text-indigo-100' : 'justify-start text-slate-400 dark:text-slate-500'}`}>
                                  {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                  {isMe && (msg.status === 'sending' ? <Loader2 size={9} className="animate-spin text-white"/> : <CheckCheck size={12} className="text-white"/>)}
                              </div>
                              </div>
                          </div>
                      );
                      })}
                      <div ref={scrollRef}></div>
                  </>
              )}
            </div>

            {/* Chat Control Center Footer Panel */}
            {isChatLocked ? (
              <div className="flex-none p-3.5 bg-slate-50 dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800/80 flex justify-center shrink-0 w-full">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-200/60 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold shadow-inner">
                      <Lock size={12} className="text-slate-400" /> {lockReason}
                  </div>
              </div>
            ) : (
              <div className="flex-none p-3 bg-white dark:bg-[#0F1524] border-t border-slate-200 dark:border-slate-800/80 z-30 flex flex-col gap-2 shrink-0 w-full overflow-hidden">
                  
                  {/* Quick replies track container */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar items-center">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0 mr-1">Quick Reply:</span>
                      {quickReplies.map((reply, index) => (
                          <button key={index} onClick={() => handleQuickReplyClick(reply)} disabled={!isConnected} className="whitespace-nowrap px-2.5 py-1 bg-slate-50 dark:bg-[#151C2C] hover:bg-slate-100 dark:hover:bg-[#1C263B] text-slate-600 dark:text-slate-300 text-[11px] rounded-lg transition-colors border border-slate-200 dark:border-slate-800 shrink-0 disabled:opacity-40">
                              {reply}
                          </button>
                      ))}
                  </div>

                  {/* Input Core Form Section */}
                  <div className="relative flex items-end gap-2 w-full max-w-5xl mx-auto px-0.5">
                    <div className="flex-1 min-w-0 flex items-end bg-slate-50 dark:bg-[#151C2C] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/5 transition-all">
                      <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors shrink-0 mb-0.5"><Paperclip size={15}/></button>
                      <textarea 
                          ref={textareaRef} 
                          value={input} 
                          onChange={handleInput} 
                          disabled={!isConnected || isSending || isChatLocked}
                          placeholder={!isConnected ? "Re-establishing system encryption keys..." : "Type a secure message..."} 
                          rows={1}
                          className="flex-1 min-w-0 bg-transparent text-slate-900 dark:text-white border-none outline-none focus:ring-0 mx-1 py-1 transition-all resize-none overflow-y-auto max-h-[120px] text-xs md:text-sm custom-scrollbar disabled:opacity-50" 
                      />
                      <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors shrink-0 mb-0.5"><Smile size={15}/></button>
                    </div>
                    <button 
                       onClick={handleSend} 
                       disabled={!input.trim() || isSending || !isConnected} 
                       className="w-9 h-9 md:w-10 md:h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0 disabled:opacity-40"
                    >
                        {isSending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} className="ml-0.5" />}
                    </button>
                  </div>
              </div>
            )}
          </>
        ) : (
          /* Empty Chat Screen Selection State (Desktop) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#FAFBFD] dark:bg-[#0B0F19]">
             <div className="w-12 h-12 bg-white dark:bg-[#0F1524] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center shadow-md text-indigo-500 mb-3">
                <MessageSquare size={20} />
             </div>
             <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Select an active link</h3>
             <p className="text-[11px] text-slate-400 max-w-xs mt-0.5 leading-relaxed">
               Choose a contractor or contract proposal timeline segment within the sidebar terminal to process communication lines.
             </p>
          </div>
        )}
      </div>

      {/* ==========================================
         PANEL 3: MODALS PIPELINE LAYER
         ========================================== */}
      {/* DIRECT HIRE CONTRACT FUNDING MODAL */}
      {hireModalOpen && (
          <Modal title="Secure Escrow Capitalization" onClose={closeHireModal}>
              <form onSubmit={handleDirectHire} className="space-y-4 p-0.5">
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 p-3.5 rounded-xl text-[11px] border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-2.5 leading-relaxed">
                      <ShieldAlert className="shrink-0 text-indigo-500 mt-0.5" size={15} />
                      <p>You are authorizing an escrow allocation contract for <strong>{activeChat.name}</strong>. Held resources are quarantined and only dispatched post milestones approvals.</p>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Contract Reference Title</label>
                      <Input name="title" type="text" placeholder="e.g. Production Infrastructure Assembly Assets" required className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs py-2 rounded-xl"/>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Allocated Target Value (₹)</label>
                      <Input
                        name="amount"
                        type="number"
                        placeholder="5000"
                        min="50"
                        required
                        value={hireAmount}
                        onChange={(event) => setHireAmount(event.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs py-2 rounded-xl"
                      />
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 dark:border-indigo-950/20 dark:bg-indigo-950/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Wallet size={15} className="text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-200">Apply interior wallet tokens</p>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Available vault ledger: ₹{walletBalance.toFixed(2)}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={useWalletForHire}
                          onChange={() => setUseWalletForHire(prev => !prev)}
                          disabled={walletBalance <= 0 || numericHireAmount <= 0}
                        />
                        <div className="w-8 h-4.5 rounded-full bg-slate-200 dark:bg-slate-800 peer-checked:bg-indigo-600 transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-3.5" />
                      </label>
                    </div>

                    {useWalletForHire && hireWalletDeduction > 0 && (
                      <div className="mt-2.5 space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2.5 text-[11px] font-semibold">
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Internal Liquidity deduction</span>
                          <span>- ₹{hireWalletDeduction.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 dark:text-white font-bold">
                          <span>External Delta required</span>
                          <span>₹{hireFinalPayable.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-3">
                      <Button variant="outline" type="button" onClick={closeHireModal} className="w-full text-xs font-bold py-2 rounded-xl">Dismiss</Button>
                      <Button type="submit" disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-xs font-bold py-2 rounded-xl">
                          {isSending ? <Loader2 size={14} className="animate-spin mx-auto"/> : hireFinalPayable === 0 && hireWalletDeduction > 0 ? "Authorize Wallet Liquidation" : numericHireAmount > 0 ? `Execute Payable ₹${hireFinalPayable || numericHireAmount}` : "Secure Escrow & Bind"}
                      </Button>
                  </div>
              </form>
          </Modal>
      )}

      {/* COMPLIANCE REPORT MODAL */}
      {reportModalOpen && (
          <Modal title="File Compliance Infraction" onClose={() => setReportModalOpen(false)}>
              <form onSubmit={handleReportUser} className="space-y-4 p-0.5">
                  <div className="bg-red-50/60 dark:bg-red-950/10 text-red-600 dark:text-red-400 p-3 rounded-xl text-[11px] border border-red-100 dark:border-red-950/20 font-medium leading-relaxed">
                      Incident logs are isolated and dispatched through standard structural audit reviews within 24 operational hours.
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Classification Vector</label>
                      <Input name="reason" type="select" options={["Attempting to bypass platform/escrow", "Harassment or abuse", "Spam propagation", "Other violation parameters"]} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs py-2 rounded-xl"/>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Granular Context Payload</label>
                      <Input name="details" type="textarea" placeholder="Provide factual transactional log context regarding this interaction sequence..." className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs py-2 rounded-xl min-h-[100px]"/>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-3">
                      <Button variant="outline" onClick={() => setReportModalOpen(false)} className="w-full text-xs font-bold py-2 rounded-xl">Abort</Button>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg text-xs font-bold py-2 rounded-xl">Dispatch Complaint</Button>
                  </div>
              </form>
          </Modal>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar{display:none;} .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
        @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default ChatSystem;
