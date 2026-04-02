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
  const [isConnected, setIsConnected] = useState(false); // 🚀 NEW: Connection State
  
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
  const isDirectChat = !activeChat?.application_id || isUuid(activeChat?.application_id);
  const appId = isDirectChat ? null : activeChat?.application_id;

  // 3. FETCH HISTORY & CONNECT WEBSOCKET
  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId || !myId) return; 

    // Generate a consistent Room ID
    const sortedIds = [myId, chatId].sort();
    const roomId = appId ? `app_${appId}` : `direct_${sortedIds[0]}_${sortedIds[1]}`;

    let isMounted = true; 

    // A. Fetch historical messages from Supabase
    const fetchMessages = async () => {
      setLoading(true);
      try {
        let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50);

        if (appId) {
            query = query.eq('application_id', appId);
        } else {
            query = query.is('application_id', null)
                         .or(`and(sender_id.eq.${myId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${myId})`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        if (data && isMounted) {
          setMessages([...data].reverse()); 
          if (data.length < 50) setHasMore(false);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();

    // B. Connect to Cloudflare Worker Securely
    const connectWebSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("🛑 [Frontend] No Supabase session found! Cannot connect.");
        return;
      }

      try {
        // ==========================================
        // 🎟️ THE 20/20 TICKET FIX
        // Fetch a 30-second ticket so we don't leak the real token!
        // ==========================================
        const httpUrl = WORKER_URL.replace("wss://", "https://").replace("ws://", "http://");
        const ticketRes = await fetch(`${httpUrl}/chat/ticket`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!ticketRes.ok) throw new Error("Failed to authenticate with chat server");
        const { ticket } = await ticketRes.json();

        // Connect using the temporary ticket
        const wsUrl = `${WORKER_URL}/chat/${roomId}?ticket=${ticket}`;
        console.log(`🌐 [Frontend] Connecting securely with ticket to room: ${roomId}`);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(`✅ [Frontend] Locked into Cloudflare Room: ${roomId}`);
          if (isMounted) setIsConnected(true);
        };

        ws.onerror = (error) => {
          console.error("🚨 [Frontend] WebSocket onerror event triggered!", error);
        };

        ws.onmessage = (event) => {
           const newMsg = JSON.parse(event.data);
           
           // Catch Server Errors & Logs
           if (newMsg.error) {
               console.error("🚨 SERVER REJECTED CONNECTION:", newMsg.error);
               alert("Chat Connection Error: " + newMsg.error);
               return;
           }
           if (newMsg.system) {
               console.log("✅ SERVER MESSAGE:", newMsg.system);
               return;
           }

           // Strict deduplication against itself AND previous messages
           if (newMsg.type === "history") {
               setMessages(prev => {
                   const existingIds = new Set(prev.map(m => m.id || m.client_temp_id));
                   const uniqueHistory = [];
                   
                   for (const m of newMsg.messages) {
                       const identifier = m.id || m.client_temp_id;
                       
                       // If we haven't seen this ID on the screen OR in this current batch...
                       if (!existingIds.has(identifier)) {
                           existingIds.add(identifier); 
                           uniqueHistory.push(m);
                       }
                   }
                   return [...prev, ...uniqueHistory];
               });
               return;
           }
           
           // Handle incoming standard messages
           setMessages((prev) => {
             if (newMsg.sender_id === myId && newMsg.client_temp_id) {
               return prev.map(msg => msg.id === newMsg.client_temp_id ? { ...newMsg, status: "sent", id: newMsg.id || newMsg.client_temp_id } : msg);
             }
             
             const exists = prev.some(msg => (msg.id === newMsg.id) || (msg.id === newMsg.client_temp_id));
             if (exists) return prev;
             
             return [...prev, newMsg];
           });
        };

        ws.onclose = (event) => {
          if (isMounted) setIsConnected(false);
          console.warn(`⚠️ [Frontend] WebSocket disconnected. Code: ${event.code}`);
          
          // ==========================================
          // 🌩️ THE 20/20 JITTER FIX
          // Auto-Reconnect with random delay to prevent Server Storms
          // ==========================================
          if (isMounted && event.code !== 1008 && event.code !== 1000) {
              const delay = 2000 + Math.random() * 3000; // Random delay between 2-5 seconds
              console.log(`🔄 Attempting to auto-reconnect in ${Math.round(delay)}ms...`);
              setTimeout(() => {
                  if (isMounted) connectWebSocket();
              }, delay);
          }
        };

        wsRef.current = ws;

      } catch (err) {
        console.error("❌ WebSocket Connection Error:", err);
      }
    };

    connectWebSocket();
      
    return () => { 
      isMounted = false;
      if (wsRef.current) {
          wsRef.current.close(1000, "Component unmounted"); 
      }
    };
  }, [activeChat?.id, myId, appId, isDirectChat]); 

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
        client_temp_id: tempId,
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
        client_temp_id: tempId,
        application_id: appId, 
        receiver_id: activeChat.id, 
        content: messageText
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(wsPayload));
        return true;
    } else {
        console.error("WebSocket is not connected.");
        setMessages((prev) => prev.filter(msg => msg.id !== tempId));
        alert("Connection lost. Please wait to reconnect.");
        return false;
    }
  };

  // Export isConnected so your UI can optionally show a "Connecting..." indicator
  return { messages, input, setInput, loading, myId, executeSendMessage, loadMore, hasMore, isConnected };
};