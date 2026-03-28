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

  useEffect(() => {
    if (initialMessage) setInput(initialMessage);
  }, [initialMessage]);

  // 🧠 THE FIX: Safely differentiate a Service UUID from an Application BigInt
  const isUuid = (val) => typeof val === 'string' && val.includes('-');
  const isDirectChat = !activeChat?.application_id || isUuid(activeChat.application_id);
  const appId = isDirectChat ? null : activeChat.application_id;

  // 3. FETCH MESSAGES & REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!activeChat?.id || !myId) return; 

    const fetchMessages = async () => {
      setLoading(true);
      try {
        let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50);

        if (appId) {
            query = query.eq('application_id', appId); // Project Chat
        } else {
            // Direct Chat
            query = query.is('application_id', null)
                         .or(`and(sender_id.eq.${myId},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${myId})`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          setMessages([...data].reverse()); 
          if (data.length < 50) setHasMore(false);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // 🧠 THE FIX: Sort IDs alphabetically so User A and User B connect to the EXACT same WebSocket channel!
    const sortedIds = [myId, activeChat.id].sort();
    const channelName = appId ? `chat_app_${appId}` : `chat_direct_${sortedIds[0]}_${sortedIds[1]}`;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
      }, (payload) => {
         const newMsg = payload.new;
         if (newMsg.sender_id !== myId) {
            
            // Security Check: Does this incoming message belong in THIS specific chat window?
            if (isDirectChat) {
                const belongsToUs = (newMsg.sender_id === activeChat.id && newMsg.receiver_id === myId);
                if (!belongsToUs || newMsg.application_id !== null) return;
            } else {
                if (newMsg.application_id?.toString() !== appId?.toString()) return;
            }

            setMessages((prev) => {
              const exists = prev.some(msg => msg.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg];
            });
         }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, myId, appId, isDirectChat]); 

  // 4. PAGINATION (LOAD MORE)
  const loadMore = async () => {
    if (!hasMore || !activeChat?.id) return;
    
    let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).range(messages.length, messages.length + 49);
    
    if (appId) {
        query = query.eq('application_id', appId);
    } else {
        query = query.is('application_id', null).or(`and(sender_id.eq.${myId},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${myId})`);
    }

    const { data, error } = await query;
    if (!error && data) {
      if (data.length < 50) setHasMore(false);
      setMessages(prev => [...[...data].reverse(), ...prev]);
    }
  };

  // 5. BULLETPROOF SEND LOGIC 
  const executeSendMessage = async () => {
    if (!input.trim() || !activeChat?.id || !myId) return false;

    const tempId = `temp-${Date.now()}`;
    const messageText = input;
    
    const optimisticMsg = { 
        id: tempId,
        application_id: appId, 
        sender_id: myId,
        receiver_id: activeChat.id, 
        content: messageText,
        created_at: new Date().toISOString(),
        status: "sending"
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');

    // DB Payload 
    const dbPayload = {
        application_id: appId, 
        sender_id: myId,
        receiver_id: activeChat.id, 
        content: messageText
    };

    const { data, error } = await supabase.from('messages').insert([dbPayload]).select().single(); 

    if (error) {
        console.error("Send error:", error);
        setMessages((prev) => prev.filter(msg => msg.id !== tempId));
        if (error.message.includes('TRUST_SAFETY_BLOCK')) {
            alert(`Blocked by Server: ${error.message.replace('TRUST_SAFETY_BLOCK: ', '')}`);
        } else {
            alert("Message failed to send. Check Supabase RLS policies!");
        }
        return false;
    } else {
        setMessages((prev) => prev.map(msg => msg.id === tempId ? { ...data, status: "sent" } : msg));
    }
    return true;
  };

  return { messages, input, setInput, loading, myId, executeSendMessage, loadMore, hasMore };
};