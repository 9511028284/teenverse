import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, Send, ArrowLeft, Loader2, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { supabase } from '../../supabase';

const ChatSystem = ({ user, activeChat, setActiveChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // 1. Fetch List of People you've talked to
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Get all messages sent or received by current user
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const uniqueUsers = {};
        data.forEach(msg => {
          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          // Simple logic to get a name (In real app, join with users table)
          // Here we assume activeChat passes a name, or we use "User"
          if (!uniqueUsers[otherId]) {
            uniqueUsers[otherId] = { 
              id: otherId, 
              name: (activeChat?.id === otherId ? activeChat.name : "User " + otherId.slice(0,4)), 
              lastMsg: msg.content,
              timestamp: msg.created_at
            };
          }
        });

        // If we started a new chat from Dashboard, ensure that user is in the list
        if (activeChat && !uniqueUsers[activeChat.id]) {
           uniqueUsers[activeChat.id] = { 
             id: activeChat.id, 
             name: activeChat.name, 
             lastMsg: "Start a conversation...", 
             timestamp: new Date().toISOString() 
           };
        }

        setContacts(Object.values(uniqueUsers));
      } catch (err) {
        console.error("Error loading contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [user, activeChat]);

  // 2. Fetch Messages & Subscribe to Realtime
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
    };

    fetchMessages();

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         // Only add if it belongs to this conversation
         if (
           (newMsg.sender_id === user.id && newMsg.receiver_id === activeChat.id) || 
           (newMsg.sender_id === activeChat.id && newMsg.receiver_id === user.id)
         ) {
            setMessages((prev) => [...prev, newMsg]);
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, user]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msgData = { 
        sender_id: user.id, 
        receiver_id: activeChat.id, 
        content: input 
    };

    // Optimistic update (Show immediately)
    // setMessages([...messages, { ...msgData, created_at: new Date().toISOString() }]); 
    setInput('');

    const { error } = await supabase.from('messages').insert([msgData]);
    if (error) console.error("Send error:", error);
  };

  // --- MOBILE RESPONSIVE LOGIC ---
  // If activeChat is null -> Show List (hidden md:block if not null)
  // If activeChat is set -> Show Chat (hidden md:block if null)

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
      
      {/* LEFT: CONTACTS LIST */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">
           Messages
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {loading ? (
             <div className="p-4 text-center text-gray-400"><Loader2 className="animate-spin mx-auto"/> Loading...</div>
           ) : contacts.length === 0 ? (
             <div className="p-4 text-center text-gray-400 text-sm">No conversations yet.</div>
           ) : (
             contacts.map(c => (
               <div 
                 key={c.id} 
                 onClick={() => setActiveChat(c)} 
                 className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-all ${activeChat?.id === c.id ? 'bg-white dark:bg-gray-700 border-l-4 border-l-indigo-600 shadow-sm' : ''}`}
               >
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                        {c.name[0]}
                     </div>
                     <div className="overflow-hidden">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{c.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastMsg}</p>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

      {/* RIGHT: CHAT WINDOW */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-[#0B1120] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900 shadow-sm z-10">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                 {activeChat.name[0]}
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 dark:text-white">{activeChat.name}</h3>
                 <span className="text-xs text-green-500 flex items-center gap-1">● Online</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-[#0B1120]">
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm relative group ${
                        isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                     }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 flex justify-end items-center gap-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                           {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           {isMe && <CheckCheck size={12} className="opacity-70"/>}
                        </div>
                     </div>
                  </div>
                );
              })}
              <div ref={scrollRef}></div>
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input 
                 value={input} 
                 onChange={(e) => setInput(e.target.value)} 
                 placeholder="Type a message..." 
                 className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-black border focus:border-indigo-500 dark:text-white rounded-xl px-4 py-3 focus:outline-none transition-all" 
              />
              <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all transform active:scale-95">
                 <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-[#0B1120]">
             <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={40} className="opacity-50"/>
             </div>
             <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;

