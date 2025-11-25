import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, CheckCheck, MessageSquare } from 'lucide-react';
import { supabase } from '../../supabase'; // Adjust path

const ChatSystem = ({ user, activeChat: propActiveChat, setActiveChat: propSetActiveChat }) => {
  // Internal state for demo purposes if props aren't provided
  const [internalActiveChat, setInternalActiveChat] = useState(null);
  const activeChat = propActiveChat || internalActiveChat;
  const setActiveChat = propSetActiveChat || setInternalActiveChat;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // 1. Fetch Contacts
  useEffect(() => {
    if (!user) return;
    
    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const uniqueUsers = {};
        data.forEach(msg => {
          // Identify the "other" person
          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          
          if (!uniqueUsers[otherId]) {
            uniqueUsers[otherId] = { 
              id: otherId, 
              // Fallback name logic since we don't have a users table joined yet
              name: "User " + otherId.slice(0, 4), 
              lastMsg: msg.content,
              timestamp: msg.created_at
            };
          }
        });
        setContacts(Object.values(uniqueUsers));
      } catch (err) {
        console.error("Error fetching contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [user]);

  // 2. Fetch Messages & Realtime
  useEffect(() => {
    if (!activeChat || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) console.error("Error loading chat:", error);
      else setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to NEW messages
    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         // Check if this message belongs to the current open chat
         const isRelevant = 
           (newMsg.sender_id === user.id && newMsg.receiver_id === activeChat.id) || 
           (newMsg.sender_id === activeChat.id && newMsg.receiver_id === user.id);

         if (isRelevant) {
            setMessages((prev) => [...prev, newMsg]);
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, user]);

  // 3. Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Send Message (FIXED)
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user || !activeChat) return;

    const msgContent = input;
    setInput(''); // Clear input immediately

    // CRITICAL FIX: Direct usage of string IDs. No .toISOString()
    const msgData = { 
        sender_id: user.id, 
        receiver_id: activeChat.id, 
        content: msgContent
    };

    // Optimistic UI Update (Make it feel instant)
    const optimisticMsg = { ...msgData, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Send to Supabase
    const { error } = await supabase.from('messages').insert([msgData]);
    
    if (error) {
      console.error("Supabase Write Error:", error);
      alert("Failed to send message. Check console.");
      // Rollback optimistic update if needed, or refresh
    }
  };

  return (
    <div className="flex h-[80vh] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
      
      {/* Sidebar / Contacts */}
      <div className={`w-full md:w-80 border-r bg-gray-50 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 font-bold border-b">Chats</div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-4"><Loader2 className="animate-spin"/></div> : 
           contacts.length === 0 ? <div className="p-4 text-gray-400">No chats yet.</div> :
           contacts.map(c => (
             <div key={c.id} onClick={() => setActiveChat(c)} className="p-4 border-b hover:bg-white cursor-pointer flex gap-3 items-center">
               <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">{c.name[0]}</div>
               <div>
                 <div className="font-bold text-sm">{c.name}</div>
                 <div className="text-xs text-gray-500 truncate w-40">{c.lastMsg}</div>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 shadow-sm">
              <button onClick={() => setActiveChat(null)} className="md:hidden"><ArrowLeft/></button>
              <div className="font-bold">{activeChat.name}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-xl text-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800'}`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type..." className="flex-1 border rounded-lg px-4 py-2 outline-none focus:border-indigo-500"/>
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg"><Send size={20}/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-2 opacity-50"/>
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;