import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, Send, ArrowLeft, Loader2, CheckCheck, MessageSquare, Flag, ShieldAlert, Search, Paperclip, X, FileText, Download } from 'lucide-react'; 
import { supabase } from '../../supabase';
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';     
import Input from '../ui/Input';     

// AI LIBRARIES
import * as toxicity from '@tensorflow-models/toxicity';
import '@tensorflow/tfjs';

const ChatSystem = ({ user, activeChat, setActiveChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [reportModalOpen, setReportModalOpen] = useState(false); 
  
  // FILE UPLOAD STATES
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // AI STATES
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isToxic, setIsToxic] = useState(false);

  // 1. LOAD AI MODEL
  useEffect(() => {
    const loadModel = async () => {
      try {
        const threshold = 0.9; 
        const loadedModel = await toxicity.load(threshold);
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (e) {
        console.error("AI Model failed to load", e);
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // 2. FETCH CONTACTS
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
              lastMsg: msg.file_url ? '📎 Attachment' : msg.content,
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

  // 3. FETCH MESSAGES
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

  // AUTO SCROLL
  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, attachment]);

  // 4. FILE HANDLING
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 90 * 1024) {
        alert("File too large! Maximum limit is 90KB.");
        e.target.value = ""; 
        return;
    }
    setAttachment(file);
  };

  // 5. SEND MESSAGE
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;

    if (input.trim() && model) {
        const predictions = await model.classify([input]);
        const isBad = predictions.some(p => p.results[0].match === true);
        if (isBad) {
            setIsToxic(true);
            setTimeout(() => setIsToxic(false), 3000);
            return; 
        }
    }

    setIsUploading(true);
    let fileUrl = null;

    if (attachment) {
        try {
            const fileExt = attachment.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, attachment);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
            fileUrl = urlData.publicUrl;
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file.");
            setIsUploading(false);
            return;
        }
    }

    const msgData = { 
        sender_id: user.id, 
        receiver_id: activeChat.id, 
        content: input,
        file_url: fileUrl,       
        file_name: attachment ? attachment.name : null 
    };

    const { error } = await supabase.from('messages').insert([msgData]);
    if (error) console.error("Send error:", error);
    
    setInput('');
    setAttachment(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsUploading(false);
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

  // --- UI RENDER ---
  return (
    <div className="flex w-full md:max-w-7xl md:mx-auto md:h-[85vh] bg-black text-white md:rounded-[32px] overflow-hidden md:shadow-2xl md:border border-gray-800 relative font-sans">
      
      {/* TOAST ALERT */}
      <div className={`fixed top-10 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-[100] ${isToxic ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-red-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <ShieldAlert size={20} className="animate-pulse" />
            <span className="font-bold text-sm">Toxic Content Detected</span>
        </div>
      </div>

      {/* --- CONTACTS SIDEBAR --- */}
      <div className={`w-full md:w-[320px] flex flex-col bg-gray-950 border-r border-gray-800 ${activeChat ? 'hidden md:flex' : 'flex h-[100vh] md:h-auto'}`}>
        <div className="p-6">
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6 tracking-tight">MESSAGES</h1>
            <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type="text" placeholder="Search..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600" />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
           {loading ? <div className="text-center text-gray-600 mt-10"><Loader2 className="animate-spin mx-auto"/></div> : contacts.map(c => (
               <div key={c.id} onClick={() => setActiveChat(c)} className={`p-3 rounded-xl cursor-pointer transition-all border border-transparent ${activeChat?.id === c.id ? 'bg-gray-900 border-gray-800' : 'hover:bg-gray-900/50'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeChat?.id === c.id ? 'bg-gradient-to-tr from-blue-500 to-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{c.name[0]}</div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center"><h4 className={`font-semibold text-sm truncate ${activeChat?.id === c.id ? 'text-white' : 'text-gray-300'}`}>{c.name}</h4><span className="text-[10px] text-gray-600">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                        <p className={`text-xs truncate ${activeChat?.id === c.id ? 'text-blue-400' : 'text-gray-600'}`}>{c.lastMsg}</p>
                     </div>
                  </div>
               </div>
             ))
           }
        </div>
      </div>

      {/* --- CHAT AREA (FIXED MOBILE OVERLAY) --- */}
      {/* On mobile, this becomes a full-screen overlay (fixed inset-0) to handle address bars/zoom */}
      <div className={`
          md:relative md:flex md:flex-col md:flex-1 bg-black
          fixed inset-0 z-50 flex flex-col
          ${!activeChat ? 'hidden md:hidden' : 'flex'}
          ${!activeChat && 'md:flex'} 
      `}>
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none"></div>

        {activeChat ? (
          <>
            {/* 1. FLOATING TOP CONTROLS (No Header Bar) */}
            <div className="absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-start pointer-events-none">
                {/* Back Button (Mobile Only) */}
                <button onClick={() => setActiveChat(null)} className="md:hidden pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-95 transition-transform">
                    <ArrowLeft size={20}/>
                </button>

                {/* ANIMATED REPORT BUTTON */}
                <button 
                    onClick={() => setReportModalOpen(true)} 
                    className="pointer-events-auto ml-auto group relative flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-95"
                >
                    <Flag size={16} className="text-red-400 animate-pulse" />
                    <span className="text-xs font-bold text-red-400 tracking-wide uppercase">Report</span>
                </button>
            </div>

            {/* 2. MESSAGES LIST (The only scrollable part) */}
            <div className="flex-1 overflow-y-auto px-4 pt-20 pb-4 space-y-6 scroll-smooth custom-scrollbar">
              {/* Chat Start Indicator */}
              <div className="text-center py-10 opacity-30">
                 <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto flex items-center justify-center mb-3">
                    <UserCircle size={30} className="text-gray-400"/>
                 </div>
                 <p className="text-sm">This is the start of your conversation with <span className="font-bold text-white">{activeChat.name}</span></p>
              </div>

              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] sm:max-w-[70%] px-5 py-4 text-[15px] shadow-2xl relative backdrop-blur-sm border
                        ${isMe 
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-50 rounded-[20px] rounded-tr-sm' 
                            : 'bg-gray-900/60 border-gray-800 text-gray-300 rounded-[20px] rounded-tl-sm'
                        }`
                     }>
                        {msg.file_url && (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 mb-3 rounded-xl transition-colors border ${isMe ? 'bg-black/30 border-blue-400/20' : 'bg-black/30 border-gray-700'}`}>
                                <div className="p-2 bg-white/10 rounded-lg"><FileText size={18}/></div>
                                <div className="text-xs font-medium truncate max-w-[150px] opacity-90">{msg.file_name || "Attachment"}</div>
                                <Download size={14} className="ml-auto opacity-50"/>
                            </a>
                        )}

                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        
                        <div className="text-[10px] mt-2 flex items-center gap-1 justify-end opacity-50 font-bold tracking-wider">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            {isMe && <CheckCheck size={12}/>}
                        </div>
                     </div>
                  </div>
                );
              })}
              <div ref={scrollRef}></div>
            </div>

            {/* 3. INPUT BAR (Fixed at bottom) */}
            <div className="flex-none p-4 bg-black/80 backdrop-blur-xl border-t border-gray-900/50 z-30">
              <div className="relative flex items-end gap-2 max-w-3xl mx-auto">
                {attachment && (
                    <div className="absolute -top-14 left-0 bg-gray-900 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
                        <FileText size={14}/> {attachment.name} <button onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}><X size={14}/></button>
                    </div>
                )}

                <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="file-upload"/>
                    <label htmlFor="file-upload" className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"><Paperclip size={20}/></label>
                </div>

                <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type a message..." 
                    rows={1}
                    className="flex-1 bg-gray-900/50 border border-gray-800 text-white rounded-[24px] py-3 px-5 focus:outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all resize-none min-h-[48px] max-h-[120px]" 
                />
                
                <button 
                    onClick={sendMessage}
                    disabled={(!input.trim() && !attachment)} 
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                    <Send size={20} className="ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* DESKTOP EMPTY STATE */
          <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-600">
             <MessageSquare size={64} className="opacity-20 mb-4"/>
             <p>Select a chat to begin</p>
          </div>
        )}

        {/* REPORT MODAL */}
        {reportModalOpen && (
            <Modal title="Report User" onClose={() => setReportModalOpen(false)}>
                <form onSubmit={handleReportUser} className="space-y-4">
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20">Strict action is taken against false reports.</div>
                    <Input name="reason" type="select" options={["Harassment", "Spam", "Inappropriate", "Other"]} className="bg-gray-900 border-gray-800 text-white"/>
                    <Input name="details" type="textarea" placeholder="Details..." className="bg-gray-900 border-gray-800 text-white min-h-[100px]"/>
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setReportModalOpen(false)} className="w-full text-gray-400 hover:bg-gray-800">Cancel</Button>
                        <Button className="w-full bg-red-600 hover:bg-red-500 text-white shadow-lg">Submit</Button>
                    </div>
                </form>
            </Modal>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;