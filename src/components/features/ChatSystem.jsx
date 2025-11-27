import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, Send, ArrowLeft, Loader2, CheckCheck, MessageSquare, Flag, ShieldAlert } from 'lucide-react'; 
import { supabase } from '../../supabase';
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';     
import Input from '../ui/Input';     

// 1. IMPORT AI LIBRARIES
import * as toxicity from '@tensorflow-models/toxicity';
import '@tensorflow/tfjs';

const ChatSystem = ({ user, activeChat, setActiveChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [reportModalOpen, setReportModalOpen] = useState(false); 
  
  // AI STATES
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isToxic, setIsToxic] = useState(false); // To show warning UI

  // 2. LOAD AI MODEL ON MOUNT
  useEffect(() => {
    const loadModel = async () => {
      console.log("Loading AI Moderation Model...");
      // Threshold = 0.9 means we only block if AI is 90% sure it's bad
      const threshold = 0.9; 
      const loadedModel = await toxicity.load(threshold);
      setModel(loadedModel);
      setIsModelLoading(false);
      console.log("AI Model Loaded!");
    };
    loadModel();
  }, []);

  // ... (Fetch Contacts Logic - Same as before) ...
  useEffect(() => {
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
          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (!uniqueUsers[otherId]) {
            uniqueUsers[otherId] = { 
              id: otherId, 
              name: (activeChat?.id === otherId ? activeChat.name : "User " + otherId.slice(0,4)), 
              lastMsg: msg.content,
              timestamp: msg.created_at
            };
          }
        });

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

  // ... (Fetch Messages Logic - Same as before) ...
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

    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         if ((newMsg.sender_id === user.id && newMsg.receiver_id === activeChat.id) || (newMsg.sender_id === activeChat.id && newMsg.receiver_id === user.id)) {
            setMessages((prev) => [...prev, newMsg]);
         }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, user]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 3. MODIFIED SEND MESSAGE FUNCTION
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // --- AI CHECK START ---
    if (model) {
        const predictions = await model.classify([input]);
        // Check if any category (insult, threat, etc.) is true
        const isBad = predictions.some(p => p.results[0].match === true);
        
        if (isBad) {
            setIsToxic(true);
            // Hide warning after 3 seconds
            setTimeout(() => setIsToxic(false), 3000);
            return; // STOP! Don't send the message.
        }
    }
    // --- AI CHECK END ---

    const msgData = { sender_id: user.id, receiver_id: activeChat.id, content: input };
    setInput('');
    const { error } = await supabase.from('messages').insert([msgData]);
    if (error) console.error("Send error:", error);
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const reportData = {
        reporter_id: user.id,
        reported_user_id: activeChat.id,
        reason: formData.get('reason'),
        details: formData.get('details'),
        status: 'pending'
    };
    const { error } = await supabase.from('reports').insert([reportData]);
    if (error) { alert("Failed: " + error.message); } 
    else { alert("User reported."); setReportModalOpen(false); }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl relative">
      
      {/* AI WARNING POPUP */}
      {isToxic && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-bounce">
            <ShieldAlert size={20} />
            <span className="font-bold text-sm">Message blocked: Please be respectful.</span>
        </div>
      )}

      {/* LEFT: CONTACTS LIST */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">Messages</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {loading ? <div className="p-4 text-center text-gray-400"><Loader2 className="animate-spin mx-auto"/> Loading...</div> : 
            contacts.map(c => (
               <div key={c.id} onClick={() => setActiveChat(c)} className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-all ${activeChat?.id === c.id ? 'bg-white dark:bg-gray-700 border-l-4 border-l-indigo-600 shadow-sm' : ''}`}>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">{c.name[0]}</div>
                     <div className="overflow-hidden"><h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{c.name}</h4><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastMsg}</p></div>
                  </div>
               </div>
             ))
           }
        </div>
      </div>

      {/* RIGHT: CHAT WINDOW */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-[#0B1120] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm z-10">
              <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">{activeChat.name[0]}</div>
                  <div><h3 className="font-bold text-gray-900 dark:text-white">{activeChat.name}</h3><span className="text-xs text-green-500 flex items-center gap-1">● Online</span></div>
              </div>
              <button onClick={() => setReportModalOpen(true)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Report User"><Flag size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-[#0B1120]">
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm relative group ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 flex justify-end items-center gap-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {isMe && <CheckCheck size={12} className="opacity-70"/>}</div>
                     </div>
                  </div>
                );
              })}
              <div ref={scrollRef}></div>
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input 
                 value={input} 
                 onChange={(e) => setInput(e.target.value)} 
                 placeholder={isModelLoading ? "Initializing AI Safety..." : "Type a message..."} 
                 disabled={isModelLoading}
                 className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-black border focus:border-indigo-500 dark:text-white rounded-xl px-4 py-3 focus:outline-none transition-all disabled:opacity-50" 
              />
              <button type="submit" disabled={isModelLoading} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all transform active:scale-95 disabled:opacity-50"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-[#0B1120]">
             <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4"><MessageSquare size={40} className="opacity-50"/></div>
             <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}

        {/* Report Modal */}
        {reportModalOpen && (
            <Modal title="Report User" onClose={() => setReportModalOpen(false)}>
                <form onSubmit={handleReportUser} className="space-y-4">
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><Flag size={16}/> Your report will be reviewed by admins.</div>
                    <Input label="Reason" name="reason" type="select" options={["Harassment/Bullying", "Inappropriate Content", "Spam/Scam", "Sharing Personal Info", "Other"]} />
                    <Input label="Details (Optional)" name="details" type="textarea" placeholder="Provide more details..." />
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setReportModalOpen(false)} className="w-full">Cancel</Button>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Submit Report</Button>
                    </div>
                </form>
            </Modal>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;