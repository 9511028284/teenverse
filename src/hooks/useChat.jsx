import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; 

// IMPORTANT: Add this to your .env file: VITE_WORKER_URL=wss://your-worker-name.your-subdomain.workers.dev
const WORKER_URL = import.meta.env.VITE_WORKER_URL;

export const useChat = (activeChat, user, initialMessage) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // WebSocket Reference
  const wsRef = useRef(null);

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

  // 2. IDENTIFY CHAT TYPE & ROOM ID
  const isUuid = (val) => typeof val === 'string' && val.includes('-');
  const isDirectChat = !activeChat?.application_id || isUuid(activeChat.application_id);
  const appId = isDirectChat ? null : activeChat.application_id;

  // 3. FETCH HISTORY & CONNECT WEBSOCKET
  useEffect(() => {
    if (!activeChat?.id || !myId) return; 

    // Generate a consistent Room ID for Cloudflare Durable Objects
    const sortedIds = [myId, activeChat.id].sort();
    const roomId = appId ? `app_${appId}` : `direct_${sortedIds[0]}_${sortedIds[1]}`;

    // A. Fetch historical messages from Supabase Database
    const fetchMessages = async () => {
      setLoading(true);
      try {
        let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50);

        if (appId) {
            query = query.eq('application_id', appId);
        } else {
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

    // B. Connect to Cloudflare Worker WebSocket for Real-time
    const connectWebSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ws = new WebSocket(`${WORKER_URL}/chat/${roomId}?token=${session.access_token}`);

      ws.onopen = () => {
        console.log(`Connected to Cloudflare Room: ${roomId}`);
      };

      ws.onmessage = (event) => {
         const newMsg = JSON.parse(event.data);
         
         // 🚨 CATCH SERVER ERRORS & SYSTEM LOGS
         if (newMsg.error) {
             console.error("🚨 SERVER REJECTED CONNECTION:", newMsg.error);
             alert("Chat Connection Error: " + newMsg.error);
             return;
         }
         if (newMsg.system) {
             console.log("✅ SERVER MESSAGE:", newMsg.system);
             return;
         }
         
         setMessages((prev) => {
           // If we sent this message, update its status from 'sending' to 'sent'
           if (newMsg.sender_id === myId && newMsg.client_temp_id) {
             return prev.map(msg => msg.id === newMsg.client_temp_id ? { ...newMsg, status: "sent", id: newMsg.id || newMsg.client_temp_id } : msg);
           }
           
           // For incoming messages from the other person, prevent duplicates
           const exists = prev.some(msg => (msg.id === newMsg.id) || (msg.id === newMsg.client_temp_id));
           if (exists) return prev;
           
           return [...prev, newMsg];
         });
      };

      ws.onclose = (event) => {
        console.warn(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);
      };

      wsRef.current = ws;
    };

    connectWebSocket();
      
    return () => { 
      if (wsRef.current) wsRef.current.close(); 
    };
  }, [activeChat, myId, appId, isDirectChat]); 

  // 4. PAGINATION (LOAD MORE HISTORY FROM SUPABASE)
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

  // 5. BULLETPROOF WEBSOCKET SEND LOGIC 
  const executeSendMessage = async () => {
    if (!input.trim() || !activeChat?.id || !myId) return false;

    const tempId = `temp-${Date.now()}`;
    const messageText = input;
    
    // 1. Optimistic UI Update
    const optimisticMsg = { 
        id: tempId,
        client_temp_id: tempId, // Track this to match WS response
        application_id: appId, 
        sender_id: myId,
        receiver_id: activeChat.id, 
        content: messageText,
        created_at: new Date().toISOString(),
        status: "sending"
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');

    // 2. Send payload via WebSocket to Cloudflare Worker
    const wsPayload = {
        client_temp_id: tempId, // Tells the worker to echo this back so we can mark it 'sent'
        application_id: appId, 
        receiver_id: activeChat.id, 
        content: messageText
        // Note: sender_id is securely attached inside the Cloudflare Worker via JWT
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(wsPayload));
        return true;
    } else {
        console.error("WebSocket is not connected.");
        setMessages((prev) => prev.filter(msg => msg.id !== tempId));
        alert("Connection lost. Please refresh the chat.");
        return false;
    }
  };

  return { messages, input, setInput, loading, myId, executeSendMessage, loadMore, hasMore };
};