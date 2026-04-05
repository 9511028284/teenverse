import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal'; // Adjust this path if your Modal component is located elsewhere
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase'; // Adjust this path to point to your Supabase client

const SupportChatModal = ({ user, onClose, showToast }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // 🚀 Auto-scroll to the bottom of the chat when a new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🚀 Load existing ticket & subscribe to real-time messages
  useEffect(() => {
    const fetchTicket = async () => {
      // 1. Check if user has an open ticket
      const { data: tickets, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);

      if (ticketErr) {
          showToast("Failed to load chat.", "error");
          setLoading(false);
          return;
      }

      if (tickets && tickets.length > 0) {
        const activeTicketId = tickets[0].id;
        setTicketId(activeTicketId);

        // 2. Fetch all previous messages for this ticket
        const { data: msgs } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', activeTicketId)
          .order('created_at', { ascending: true });
        
        if (msgs) setMessages(msgs);

        // 3. 🚀 SUBSCRIBE TO REAL-TIME REPLIES FROM ADMIN
        const channel = supabase
          .channel(`ticket_${activeTicketId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'support_messages', 
            filter: `ticket_id=eq.${activeTicketId}` 
          }, (payload) => {
            // Add new message to UI without refreshing the page!
            setMessages(prev => [...prev, payload.new]);
          })
          .subscribe();

        setLoading(false);
        
        // Cleanup subscription when modal closes
        return () => { supabase.removeChannel(channel); };
      }

      // No active ticket found, stop loading
      setLoading(false);
    };

    fetchTicket();
  }, [user.id]);

  // 🚀 Handle sending a message to the Admin
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input instantly for snappy UX

    let currentTicketId = ticketId;

    // If no ticket exists yet, create one silently on their first message
    if (!currentTicketId) {
        const { data: newTicket, error: createErr } = await supabase
            .from('support_tickets')
            .insert({ user_id: user.id, subject: "General Support" })
            .select()
            .single();
            
        if (createErr || !newTicket) return showToast("Could not start chat.", "error");
        
        currentTicketId = newTicket.id;
        setTicketId(currentTicketId);

        // 🚀 TRIGGER EMAIL: Send the "Ticket Raised" email via your Edge Function
        supabase.functions.invoke('send-parent-otp', {
            body: {
                type: "ticket",
                action: "raised",
                userEmail: user.email,
                userName: user.name,
                ticketId: currentTicketId,
                subject: "General Support"
            }
        }).catch(err => console.error("Email trigger failed:", err)); // Catch error silently so chat doesn't break
    }

    // Insert Message to the database
    const { error } = await supabase
        .from('support_messages')
        .insert({
            ticket_id: currentTicketId,
            sender_id: user.id,
            is_admin: false,
            message: messageText
        });

    if (error) {
        showToast("Failed to send.", "error");
    } else {
        // Bump the ticket's updated_at timestamp so it jumps to the top of your Admin list
        await supabase.from('support_tickets').update({ updated_at: new Date() }).eq('id', currentTicketId);
    }
  };

  return (
    <Modal title="Founder & Team Support" onClose={onClose}>
      <div className="flex flex-col h-[60vh] sm:h-[500px]">
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-white/5 rounded-2xl mb-4 border border-slate-200 dark:border-white/10 custom-scrollbar">
          {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                  <Loader2 className="animate-spin" />
              </div>
          ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <span className="text-2xl">👋</span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1">How can we help?</h4>
                  <p className="text-xs text-slate-500">Send us a message and a founder will reply shortly.</p>
              </div>
          ) : (
              messages.map((msg, idx) => {
                  const isAdmin = msg.is_admin;
                  return (
                      <div key={idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${
                              isAdmin 
                              ? 'bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 rounded-tl-sm border border-slate-100 dark:border-white/5' 
                              : 'bg-indigo-600 text-white rounded-tr-sm'
                          }`}>
                              {isAdmin && <span className="block text-[10px] font-black text-indigo-500 mb-1 uppercase tracking-wider">TeenVerseHub Team</span>}
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                              <span className={`block text-[9px] mt-1.5 opacity-60 ${isAdmin ? 'text-left' : 'text-right'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                          </div>
                      </div>
                  );
              })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="relative flex items-center shrink-0">
            <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-4 pr-14 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-slate-900 dark:text-white transition-all shadow-sm"
            />
            <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-md"
            >
                <Send size={16} />
            </button>
        </form>

      </div>
    </Modal>
  );
};

export default SupportChatModal;