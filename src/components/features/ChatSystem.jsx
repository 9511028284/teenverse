import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, MessageSquare, Send, Eye } from 'lucide-react';
import { supabase } from '../../supabase';

const ChatSystem = ({ currentUser, activeChat, setActiveChat, parentMode }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order('created_at', { ascending: false });
      if (!data) return;
      const uniqueUsers = {};
      data.forEach(msg => {
        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        if (!uniqueUsers[otherId]) {
          uniqueUsers[otherId] = { id: otherId, name: activeChat?.id === otherId ? activeChat.name : "User", lastMsg: msg.content };
        }
      });
      setContacts(Object.values(uniqueUsers));
    };
    fetchContacts();
  }, [currentUser, activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.defaultMessage) setInput(activeChat.defaultMessage);

    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`).order('created_at', { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat, currentUser]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || parentMode) return;
    const { error } = await supabase.from('messages').insert([{ sender_id: currentUser.id, receiver_id: activeChat.id, content: input }]);
    if (!error) { setMessages([...messages, { sender_id: currentUser.id, content: input, created_at: new Date().toISOString() }]); setInput(''); }
  };

  return (
    <div className="h-[600px] flex bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="w-1/3 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-300">Messages</div>
        {contacts.map(c => (
          <div key={c.id} onClick={() => setActiveChat(c)} className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-white dark:hover:bg-gray-800 ${activeChat?.id === c.id ? 'bg-white dark:bg-gray-800 border-l-4 border-indigo-600' : ''}`}>
             <div className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{c.name}</div>
             <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastMsg}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shadow-sm z-10">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserCircle className="text-gray-400"/> {activeChat.name}</h3>
              {parentMode && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1"><Eye size={12}/> Parent View</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-950">
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === currentUser.id;
                return <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>{msg.content}</div></div>;
              })}
              <div ref={scrollRef}></div>
            </div>
            <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input disabled={parentMode} value={input} onChange={(e) => setInput(e.target.value)} placeholder={parentMode ? "Chat disabled in Parent Mode" : "Type a message..."} className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-950 border focus:border-indigo-200 dark:text-white rounded-xl px-4 py-2 focus:outline-none transition-all disabled:opacity-50" />
              {!parentMode && <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700"><Send size={18} /></button>}
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col"><MessageSquare size={48} className="mb-4 opacity-20" /><p>Select a conversation</p></div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;