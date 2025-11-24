import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, MessageSquare, Send, ArrowLeft, Phone, Video, MoreVertical, Loader2 } from 'lucide-react';
// Adjust this import path to wherever your supabase client is defined
import { supabase } from '../../supabase'; 

const ChatSystem = ({ currentUser, activeChat, setActiveChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // 1. Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat]);

  // 2. Fetch Contacts (UPDATED: Uses SQL Joins for Real Names)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentUser) return;
      
      // We fetch the latest messages involving the current user
      // AND we join the 'profiles' table to get names/avatars instantly
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, avatar_url),
          receiver:receiver_id(full_name, avatar_url)
        `)
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false }); // Get newest first to show recent chats

      if (error) {
        console.error("Error fetching contacts:", error);
        return;
      }

      // Logic to find unique people you've talked to
      const uniqueUsersMap = {};
      
      data.forEach((msg) => {
        const isMe = msg.sender_id === currentUser.id;
        const otherId = isMe ? msg.receiver_id : msg.sender_id;
        
        // Extract the profile object (sender or receiver depending on who 'other' is)
        // If the Foreign Key was set up correctly in SQL, this data will be here.
        const otherProfile = isMe ? msg.receiver : msg.sender;

        // Save only the first time we see this user (since we ordered by newest, this is the latest msg)
        if (!uniqueUsersMap[otherId]) {
          uniqueUsersMap[otherId] = {
            id: otherId,
            name: otherProfile?.full_name || 'Unknown User', 
            avatar: otherProfile?.avatar_url || null,
            lastMsg: msg.content || 'Attachment',
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
      });
      
      setContacts(Object.values(uniqueUsersMap));
    };

    fetchContacts();
  }, [currentUser]);

  // 3. Fetch Messages for Active Chat
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true }); // Chronological order

      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    // OPTIONAL: Real-time Subscription (Live Chat)
    // accessible via: supabase.channel(...).on(...)
    const channel = supabase
      .channel(`chat:${activeChat.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          // If the new message belongs to this conversation, add it
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === activeChat.id && newMsg.receiver_id === currentUser.id) ||
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeChat.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [activeChat, currentUser]);

  // 4. Send Message Handler
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;

    const msgContent = input;
    setInput(''); // Clear input immediately for UX

    // Optimistic UI update (show immediately before database confirms)
    const optimisticMsg = {
      id: Date.now(), // temporary ID
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: msgContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Save to Supabase
    const { error } = await supabase.from('messages').insert([
       { sender_id: currentUser.id, receiver_id: activeChat.id, content: msgContent }
    ]);

    if (error) {
      console.error('Error sending:', error);
      // Optional: Show error toast here
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-950 text-white overflow-hidden font-sans">
      
      {/* ================= SIDEBAR (CONTACTS) ================= */}
      <div className={`w-full md:w-80 flex-col border-r border-gray-800 bg-gray-900 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Messages
          </h2>
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
            <UserCircle size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
             <div className="p-6 text-center text-gray-500 text-sm">
                No conversations yet.<br/>Start a job to message someone!
             </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setActiveChat(contact)}
                className={`flex items-center p-4 cursor-pointer transition-all hover:bg-gray-800 ${activeChat?.id === contact.id ? 'bg-gray-800 border-l-4 border-blue-500' : ''}`}
              >
                <div className="relative">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-lg font-bold text-white uppercase">
                      {contact.name?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold truncate text-gray-200">{contact.name}</h3>
                    <span className="text-xs text-gray-500">{contact.time}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{contact.lastMsg}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className={`flex-1 flex-col bg-gray-950 relative ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 backdrop-blur sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveChat(null)} 
                  className="md:hidden p-2 -ml-2 hover:bg-gray-800 rounded-full text-gray-300"
                >
                  <ArrowLeft size={22} />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white uppercase overflow-hidden">
                    {activeChat.avatar ? (
                      <img src={activeChat.avatar} alt="active" className="w-full h-full object-cover"/>
                    ) : (
                      activeChat.name?.[0] || '?'
                    )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base text-white">{activeChat.name}</h3>
                  <span className="text-xs text-green-400 flex items-center gap-1">● Online</span>
                </div>
              </div>
              
              <div className="flex gap-1 md:gap-2 text-gray-400">
                <button className="p-2 hover:bg-gray-800 rounded-full"><Phone size={18} /></button>
                <button className="p-2 hover:bg-gray-800 rounded-full"><Video size={18} /></button>
                <button className="p-2 hover:bg-gray-800 rounded-full"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
              {loading ? (
                <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] md:max-w-[60%] px-4 py-2 rounded-2xl ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                          : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                      }`}>
                        <p className="text-sm md:text-base">{msg.content}</p>
                        <span className={`text-[10px] block text-right mt-1 opacity-70`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 md:p-4 bg-gray-900 border-t border-gray-800 flex items-center gap-2">
              <button type="button" className="p-2 text-gray-400 hover:text-white transition hidden md:block">
                <MessageSquare size={20} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm md:text-base placeholder-gray-500"
              />
              <button 
                type="submit" 
                disabled={!input.trim()}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-900/20"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          /* Empty State (Desktop) */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-500">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <MessageSquare size={32} className="text-gray-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-300">Select a chat to start messaging</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;