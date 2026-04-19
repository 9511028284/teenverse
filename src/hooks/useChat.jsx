import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase'; 

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

// ==========================================
// 🛡️ ZERO-TOLERANCE PII & CONTACT FILTER
// ==========================================
const containsPersonalInfo = (text) => {
    if (!text) return false;
    
    // 1. Emails (Catches normal + obfuscated like "test at gmail dot com")
    const emailRegex = /[a-zA-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|\s+at\s+)\s*[a-zA-Z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|\s+dot\s+)\s*[a-zA-Z]{2,}/i;
    
    // 2. Phone Numbers (Aggressive: Catches any sequence containing 7-15 digits, even with spaces/dashes)
    const phoneRegex = /(?:\d[\s-._]*){7,15}/;
    
    // 3. URLs and Links (Catches standard URLs and raw domains like "myportfolio.com")
    const linkRegex = /(https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;
    
    // 4. Banned Platforms / Social Media Keywords
    const socialRegex = /\b(instagram|insta|ig|whatsapp|wa|telegram|tg|discord|snapchat|snap|skype|twitter|x|linkedin|facebook|fb|wechat|viber|zoom)\b/i;

    return emailRegex.test(text) || phoneRegex.test(text) || linkRegex.test(text) || socialRegex.test(text);
};

export const useChat = (activeChat, user, initialMessage, showToast) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  // Advanced Refs to prevent stale closures and memory leaks
  const wsRef = useRef(null);
  const isMountedRef = useRef(true);
  const reconnectTimeoutRef = useRef(null);

  // 1. SECURELY GET USER IDENTITY
  useEffect(() => {
    const getIdentity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMountedRef.current) {
          setMyId(session?.user?.id || user?.id || user?.user?.id);
      }
    };
    getIdentity();
  }, [user]);

  useEffect(() => {
    if (initialMessage) setInput(initialMessage);
  }, [initialMessage]);

  // Lifecycle Management
  useEffect(() => {
      isMountedRef.current = true;
      return () => {
          isMountedRef.current = false;
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          if (wsRef.current) wsRef.current.close(1000);
      };
  }, []);

  // 2. IDENTIFY CHAT TYPE & ROOM ID
  const isUuid = (val) => typeof val === 'string' && val.includes('-');
  const isDirectChat = !activeChat?.application_id || isUuid(activeChat?.application_id);
  const appId = isDirectChat ? null : activeChat?.application_id;

  // 3. CORE WEBSOCKET & HISTORY LOGIC
  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId || !myId) return; 

    const sortedIds = [myId, chatId].sort();
    const roomId = appId ? `app_${appId}` : `direct_${sortedIds[0]}_${sortedIds[1]}`;

    // A. Fetch historical messages
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
        
        if (data && isMountedRef.current) {
          setMessages([...data].reverse()); 
          if (data.length < 50) setHasMore(false);
        }
      } catch (err) {
        // Silently fail in production
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    fetchMessages();

    // B. Secure WebSocket Connection
    const connectWebSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const httpUrl = WORKER_URL.replace("wss://", "https://").replace("ws://", "http://");
        const ticketRes = await fetch(`${httpUrl}/chat/ticket`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!ticketRes.ok) throw new Error("Auth Failed");
        const { ticket } = await ticketRes.json();

        const wsUrl = `${WORKER_URL}/chat/${roomId}?ticket=${ticket}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isMountedRef.current) setIsConnected(true);
        };

        ws.onerror = () => {
          // Silently handle errors
        };

        ws.onmessage = (event) => {
           const newMsg = JSON.parse(event.data);
           
           if (newMsg.error) {
               if (showToast) showToast(`Connection Error: ${newMsg.error}`, "error");
               return;
           }
           if (newMsg.system) return;

           // Strict deduplication
           if (newMsg.type === "history") {
               setMessages(prev => {
                   const existingIds = new Set(prev.map(m => m.id || m.client_temp_id));
                   const uniqueHistory = newMsg.messages.filter(m => {
                       const identifier = m.id || m.client_temp_id;
                       if (!existingIds.has(identifier)) {
                           existingIds.add(identifier);
                           return true;
                       }
                       return false;
                   });
                   return [...prev, ...uniqueHistory];
               });
               return;
           }
           
           // Standard incoming message routing
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
          if (!isMountedRef.current) return;
          setIsConnected(false);
          
          // Auto-Reconnect with random jitter (only if abnormal closure)
          if (event.code !== 1008 && event.code !== 1000) {
              const delay = 2000 + Math.random() * 3000;
              reconnectTimeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current) connectWebSocket();
              }, delay);
          }
        };

        wsRef.current = ws;

      } catch (err) {
        // Silently fail connection errors in production
      }
    };

    connectWebSocket();
      
  }, [activeChat?.id, myId, appId, isDirectChat]); 

  // 4. PAGINATION
  const loadMore = useCallback(async () => {
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
  }, [hasMore, activeChat?.id, messages.length, appId, myId]);

  // 5. RESTRICTED SEND LOGIC 
  const executeSendMessage = useCallback(async () => {
    if (!input.trim() || !activeChat?.id || !myId) return false;

    // 🛡️ SECURITY INTERCEPT: Check for PII before processing
    if (containsPersonalInfo(input)) {
        if (showToast) {
            showToast("Message blocked. Sharing external contact info, links, or social media handles is strictly prohibited.", "error");
        }
        return false; // Abort send entirely
    }

    const tempId = `temp-${Date.now()}`;
    const messageText = input.trim();
    
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
        setMessages((prev) => prev.filter(msg => msg.id !== tempId));
        if (showToast) showToast("Connection lost. Please wait to reconnect.", "error");
        return false;
    }
  }, [input, activeChat?.id, myId, appId, showToast]);

  return { messages, input, setInput, loading, myId, executeSendMessage, loadMore, hasMore, isConnected };
};