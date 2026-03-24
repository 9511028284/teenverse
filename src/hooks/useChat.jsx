import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 

export const useChat = (activeChat, user, initialMessage) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // 1. SECURELY GET USER IDENTITY
  useEffect(() => {
    const getIdentity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setMyId(session?.user?.id || user?.id || user?.user?.id);
    };
    getIdentity();
  }, [user]);

  // 2. PRE-FILL INPUT IF TEMPLATE PROVIDED
  useEffect(() => {
    if (initialMessage) setInput(initialMessage);
  }, [initialMessage]);

  // 3. FETCH MESSAGES & REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!activeChat?.application_id || !myId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', activeChat.application_id)
        .order('created_at', { ascending: false }) 
        .limit(50); 
      
      if (!error && data) {
        setMessages(data.reverse()); 
        if (data.length < 50) setHasMore(false);
      }
      setLoading(false);
    };
    fetchMessages();

    // SECURE REALTIME WITH DEDUPLICATION
    const channel = supabase
      .channel(`chat_${activeChat.application_id}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `application_id=eq.${activeChat.application_id}`
      }, (payload) => {
         const newMsg = payload.new;
         if (newMsg.sender_id !== myId) {
            setMessages((prev) => {
              // Strict deduplication safety
              const exists = prev.some(msg => msg.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg];
            });
         }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, myId]); 

  // 4. PAGINATION (LOAD MORE)
  const loadMore = async () => {
    if (!hasMore || !activeChat?.application_id) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('application_id', activeChat.application_id)
      .order('created_at', { ascending: false })
      .range(messages.length, messages.length + 49);

    if (!error && data) {
      if (data.length < 50) setHasMore(false);
      setMessages(prev => [...data.reverse(), ...prev]);
    }
  };

  // 5. BULLETPROOF SEND LOGIC (ROLLBACK + STATUS)
  const executeSendMessage = async () => {
    if (!input.trim() || !activeChat?.application_id || !myId) return false;

    const tempId = `temp-${Date.now()}`;
    const messageText = input;
    
    const optimisticMsg = { 
        id: tempId,
        application_id: activeChat.application_id, 
        sender_id: myId,
        receiver_id: activeChat.id, 
        content: messageText,
        created_at: new Date().toISOString(),
        status: "sending"
    };

    // Optimistic UI Update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');

    // DB Payload (Exclude temp ID so Postgres auto-generates the real one)
    const dbPayload = {
        application_id: activeChat.application_id, 
        sender_id: myId,
        receiver_id: activeChat.id, 
        content: messageText
    };

    const { data, error } = await supabase
        .from('messages')
        .insert([dbPayload])
        .select()
        .single(); 

    if (error) {
        console.error("Send error:", error);
        // ROLLBACK: Remove the failed message from UI
        setMessages((prev) => prev.filter(msg => msg.id !== tempId));

        // Display Backend Trust & Safety block if triggered
        if (error.message.includes('TRUST_SAFETY_BLOCK')) {
            const cleanError = error.message.replace('TRUST_SAFETY_BLOCK: ', '');
            alert(`Blocked by Server: ${cleanError}`);
        } else {
            alert("Message failed to send. Please check your connection.");
        }
        return false;
    } else {
        // SUCCESS: Swap temp ID for real ID and mark as sent
        setMessages((prev) =>
            prev.map(msg =>
                msg.id === tempId ? { ...data, status: "sent" } : msg
            )
        );
    }
    return true;
  };

  return { 
      messages, 
      input, 
      setInput, 
      loading, 
      myId, 
      executeSendMessage,
      loadMore,
      hasMore
  };
};