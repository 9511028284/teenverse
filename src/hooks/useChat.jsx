import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';

const RAW_WORKER_URL = import.meta.env.VITE_WORKER_URL || '';
const WORKER_URL = RAW_WORKER_URL.replace(/\/$/, '');

// =====================================================
// BRUTAL CHAT SECURITY CONFIG
// =====================================================

const CHAT_SECURITY = {
  MAX_MESSAGE_LENGTH: 750,
  MIN_SEND_INTERVAL_MS: 3500,

  RATE_LIMITS: {
    PER_MINUTE: 5,
    PER_10_MINUTES: 20,
    PER_DAY: 80,
  },

  DUPLICATE_WINDOW_MS: 10 * 60 * 1000,
  VIOLATION_WINDOW_MS: 60 * 60 * 1000,
  COOLDOWN_AFTER_VIOLATIONS: 3,
  COOLDOWN_MS: 30 * 60 * 1000,

  STORAGE_PREFIX: 'teenversehub_chat_guard_v3',
};

const BLOCK_REASONS = {
  CONTACT:
    'Message blocked. Sharing phone numbers, emails, links, social handles, or external contact details is not allowed.',
  PAYMENT:
    'Message blocked. Off-platform payments, UPI, bank details, QR, or direct payment discussion is not allowed.',
  PLATFORM_BYPASS:
    'Message blocked. Trying to bypass TeenVerseHub safety, escrow, moderation, or platform rules is not allowed.',
  ABUSE:
    'Message blocked. Abusive, threatening, sexual, or unsafe content is not allowed.',
  SPAM:
    'Message blocked. Please avoid spam, repeated messages, or flooding the chat.',
  LENGTH:
    `Message blocked. Maximum allowed message length is ${CHAT_SECURITY.MAX_MESSAGE_LENGTH} characters.`,
  COOLDOWN:
    'Chat temporarily locked due to repeated rule violations. Please try again later.',
  CONNECTION:
    'Connection lost. Please wait until chat reconnects.',
};

// =====================================================
// BASIC SAFE HELPERS
// =====================================================

const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

const now = () => Date.now();

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const cleanVisibleText = (text) => {
  if (typeof text !== 'string') return '';

  return text
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return !(code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127);
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeForDetection = (text) => {
  return cleanVisibleText(text)
    .toLowerCase()
    .replace(/[ⓐ＠]/g, '@')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[०-९]/g, (d) => '०१२३४५६७८९'.indexOf(d))
    .replace(/\b(a\s*t|at)\b/g, '@')
    .replace(/\b(d\s*o\s*t|dot)\b/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
};

const compactForDetection = (text) =>
  normalizeForDetection(text).replace(/[\s\-_.()[\]{}|]/g, '');

const getRateLimitKey = (userId, chatId) => {
  return `${CHAT_SECURITY.STORAGE_PREFIX}:${userId || 'unknown'}:${chatId || 'unknown'}`;
};

const readGuardState = (userId, chatId) => {
  if (typeof window === 'undefined') {
    return {
      sentAt: [],
      violations: [],
      recentMessages: [],
      cooldownUntil: 0,
    };
  }

  const key = getRateLimitKey(userId, chatId);
  const stored = safeJsonParse(localStorage.getItem(key), null);

  return {
    sentAt: Array.isArray(stored?.sentAt) ? stored.sentAt : [],
    violations: Array.isArray(stored?.violations) ? stored.violations : [],
    recentMessages: Array.isArray(stored?.recentMessages) ? stored.recentMessages : [],
    cooldownUntil: Number(stored?.cooldownUntil || 0),
  };
};

const writeGuardState = (userId, chatId, state) => {
  if (typeof window === 'undefined') return;

  try {
    const key = getRateLimitKey(userId, chatId);
    localStorage.setItem(
      key,
      JSON.stringify({
        sentAt: state.sentAt || [],
        violations: state.violations || [],
        recentMessages: state.recentMessages || [],
        cooldownUntil: state.cooldownUntil || 0,
      })
    );
  } catch {
    // localStorage can fail in private mode; silently ignore
  }
};

const registerViolation = (userId, chatId, type) => {
  const currentTime = now();
  const state = readGuardState(userId, chatId);

  const freshViolations = [
    ...state.violations.filter(
      (v) => currentTime - Number(v.at || 0) < CHAT_SECURITY.VIOLATION_WINDOW_MS
    ),
    { at: currentTime, type },
  ];

  const shouldCooldown =
    freshViolations.length >= CHAT_SECURITY.COOLDOWN_AFTER_VIOLATIONS;

  const nextState = {
    ...state,
    violations: freshViolations,
    cooldownUntil: shouldCooldown
      ? currentTime + CHAT_SECURITY.COOLDOWN_MS
      : state.cooldownUntil || 0,
  };

  writeGuardState(userId, chatId, nextState);

  return nextState;
};

// =====================================================
// FREELANCING PLATFORM RESTRICTION ENGINE
// =====================================================

const detectBlockedContent = (rawText) => {
  const text = normalizeForDetection(rawText);
  const compact = compactForDetection(rawText);
  const digitsOnly = rawText.replace(/\D/g, '');

  if (!text) {
    return { blocked: false };
  }

  if (text.length > CHAT_SECURITY.MAX_MESSAGE_LENGTH) {
    return {
      blocked: true,
      type: 'LENGTH',
      reason: BLOCK_REASONS.LENGTH,
    };
  }

  // Emails, including obfuscated emails
  const emailRegex =
    /[a-zA-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|\s+at\s+)\s*[a-zA-Z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|\s+dot\s+)\s*[a-zA-Z]{2,}/i;

  const compactEmailRegex =
    /[a-z0-9._%+-]{2,}@[a-z0-9.-]{2,}\.[a-z]{2,}/i;

  // Phone numbers, including spaced or dashed numbers
  const phoneRegex = /(?:\+?\d[\s\-._()]*){7,15}/;

  // Links and domains
  const linkRegex =
    /(https?:\/\/|www\.)[^\s]+|(?:^|\s)[a-zA-Z0-9-]{2,}\.(com|in|net|org|io|co|me|dev|app|xyz|site|link|bio|ai|tech|online)(?:\/[^\s]*)?/i;

  // Social handles and platforms
  const socialRegex =
    /\b(instagram|insta|ig|whatsapp|whats app|watsapp|wa|telegram|tg|discord|snapchat|snap|skype|twitter|linkedin|facebook|fb|wechat|viber|zoom|google meet|meet link|signal|reddit|github|portfolio|behance|dribbble)\b/i;

  const handleRegex = /(^|\s)@[a-zA-Z0-9._]{3,30}\b/;

  const contactIntentRegex =
    /\b(call me|text me|dm me|message me|mail me|email me|contact me|send number|share number|mobile number|phone number|personal number|mera number|apna number|number do|number de|dm kar|call kar|whatsapp kar|insta pe|telegram pe)\b/i;

  if (
    emailRegex.test(rawText) ||
    compactEmailRegex.test(compact) ||
    phoneRegex.test(rawText) ||
    digitsOnly.length >= 7 ||
    linkRegex.test(rawText) ||
    socialRegex.test(text) ||
    handleRegex.test(rawText) ||
    contactIntentRegex.test(text)
  ) {
    return {
      blocked: true,
      type: 'CONTACT',
      reason: BLOCK_REASONS.CONTACT,
    };
  }

  // Off-platform payment blocking
  const paymentRegex =
    /\b(upi|gpay|google pay|phonepe|paytm|bharatpe|qr code|scan qr|bank account|account number|ifsc|swift|iban|direct payment|pay directly|outside payment|outside platform|cash payment|advance payment|escrow outside|without escrow|crypto|bitcoin|usdt|paypal|stripe|razorpay link|cashfree link)\b/i;

  if (paymentRegex.test(text)) {
    return {
      blocked: true,
      type: 'PAYMENT',
      reason: BLOCK_REASONS.PAYMENT,
    };
  }

  // Bypass / manipulation attempts
  const bypassRegex =
    /\b(bypass|avoid platform|avoid teenversehub|outside teenversehub|don't tell platform|dont tell platform|hide from platform|secret deal|private deal|deal outside|skip escrow|skip verification|fake kyc|fake profile|fake age|fake guardian|no contract|without contract|unpaid trial|free sample first|work for free)\b/i;

  if (bypassRegex.test(text)) {
    return {
      blocked: true,
      type: 'PLATFORM_BYPASS',
      reason: BLOCK_REASONS.PLATFORM_BYPASS,
    };
  }

  // Minor safety / sexual / abusive / threatening content
  const unsafeRegex =
    /\b(nude|nudes|sex|sexual|porn|onlyfans|hookup|dating|kiss|sexy|hot pic|adult|abuse|threat|kill|suicide|self harm|harass|blackmail|scam|fraud|stupid|idiot|bastard|fuck|shit|bitch|chutiya|madarchod|bhenchod|gaand|randi)\b/i;

  if (unsafeRegex.test(text)) {
    return {
      blocked: true,
      type: 'ABUSE',
      reason: BLOCK_REASONS.ABUSE,
    };
  }

  // Spam-like content
  const repeatedCharRegex = /(.)\1{14,}/;
  const tooManyEmojisRegex =
    /(?:\p{Extended_Pictographic}\s*){12,}/u;

  if (repeatedCharRegex.test(text) || tooManyEmojisRegex.test(rawText)) {
    return {
      blocked: true,
      type: 'SPAM',
      reason: BLOCK_REASONS.SPAM,
    };
  }

  return { blocked: false };
};

// =====================================================
// RATE LIMIT ENGINE
// =====================================================

const checkRateLimit = (userId, chatId, messageText) => {
  const currentTime = now();
  const state = readGuardState(userId, chatId);

  if (state.cooldownUntil && currentTime < state.cooldownUntil) {
    const minutesLeft = Math.ceil((state.cooldownUntil - currentTime) / 60000);

    return {
      allowed: false,
      type: 'COOLDOWN',
      reason: `${BLOCK_REASONS.COOLDOWN} Locked for ${minutesLeft} minute(s).`,
    };
  }

  const freshSentAt = state.sentAt.filter(
    (time) => currentTime - Number(time) < 24 * 60 * 60 * 1000
  );

  const lastSentAt = freshSentAt[freshSentAt.length - 1] || 0;

  if (currentTime - lastSentAt < CHAT_SECURITY.MIN_SEND_INTERVAL_MS) {
    return {
      allowed: false,
      type: 'SPAM',
      reason: 'Slow down. Please wait a few seconds before sending another message.',
    };
  }

  const perMinuteCount = freshSentAt.filter(
    (time) => currentTime - Number(time) < 60 * 1000
  ).length;

  const perTenMinuteCount = freshSentAt.filter(
    (time) => currentTime - Number(time) < 10 * 60 * 1000
  ).length;

  const perDayCount = freshSentAt.length;

  if (
    perMinuteCount >= CHAT_SECURITY.RATE_LIMITS.PER_MINUTE ||
    perTenMinuteCount >= CHAT_SECURITY.RATE_LIMITS.PER_10_MINUTES ||
    perDayCount >= CHAT_SECURITY.RATE_LIMITS.PER_DAY
  ) {
    return {
      allowed: false,
      type: 'SPAM',
      reason: BLOCK_REASONS.SPAM,
    };
  }

  const normalizedMessage = normalizeForDetection(messageText);
  const freshRecentMessages = state.recentMessages.filter(
    (item) => currentTime - Number(item.at || 0) < CHAT_SECURITY.DUPLICATE_WINDOW_MS
  );

  const duplicateCount = freshRecentMessages.filter(
    (item) => item.text === normalizedMessage
  ).length;

  if (duplicateCount >= 1) {
    return {
      allowed: false,
      type: 'SPAM',
      reason: 'Duplicate message blocked. Please do not send the same message again.',
    };
  }

  return {
    allowed: true,
    nextState: {
      ...state,
      sentAt: [...freshSentAt, currentTime],
      recentMessages: [
        ...freshRecentMessages,
        {
          at: currentTime,
          text: normalizedMessage.slice(0, 250),
        },
      ].slice(-20),
    },
  };
};

const commitAllowedSend = (userId, chatId, nextState) => {
  writeGuardState(userId, chatId, nextState);
};

// =====================================================
// INCOMING MESSAGE SAFETY
// =====================================================

const sanitizeIncomingMessage = (msg) => {
  if (!msg || typeof msg !== 'object') return null;

  const content = cleanVisibleText(String(msg.content || ''));

  if (!content && !msg.system && msg.type !== 'history') return null;

  return {
    ...msg,
    content: content.slice(0, CHAT_SECURITY.MAX_MESSAGE_LENGTH),
  };
};

// =====================================================
// MAIN HOOK
// =====================================================

export const useChat = (activeChat, user, initialMessage, showToast) => {
  const [messages, setMessages] = useState([]);
  const [input, rawSetInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);
  const reconnectTimeoutRef = useRef(null);

  const setInput = useCallback((value) => {
    rawSetInput((prev) => {
      const nextValue = typeof value === 'function' ? value(prev) : value;
      const cleaned = typeof nextValue === 'string' ? nextValue : '';

      return cleaned.slice(0, CHAT_SECURITY.MAX_MESSAGE_LENGTH);
    });
  }, []);

  // =====================================================
  // 1. SECURE USER IDENTITY
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const getIdentity = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || cancelled || !isMountedRef.current) return;

      const sessionUserId = data?.session?.user?.id;
      const fallbackUserId = user?.id || user?.user?.id;

      setMyId(sessionUserId || fallbackUserId || null);
    };

    getIdentity();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
    }
  }, [initialMessage, setInput]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, []);

  // =====================================================
  // 2. CHAT TYPE + ROOM ID
  // =====================================================

  const chatId = activeChat?.id || null;

  const appId = useMemo(() => {
    const value = activeChat?.application_id;

    if (!value || value === 'null' || value === 'undefined') return null;

    return String(value);
  }, [activeChat?.application_id]);

  const roomId = useMemo(() => {
    if (!chatId || !myId) return null;

    if (appId) {
      return `app_${appId}`;
    }

    const sortedIds = [myId, chatId].sort();
    return `direct_${sortedIds[0]}_${sortedIds[1]}`;
  }, [appId, chatId, myId]);

  // =====================================================
  // 3. FETCH HISTORY + WEBSOCKET
  // =====================================================

  useEffect(() => {
    if (!chatId || !myId || !roomId) return;

    let cancelled = false;
    let reconnectAttempts = 0;
    let localWs = null;

    setMessages([]);
    setHasMore(true);
    setIsConnected(false);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Switching chat');
      wsRef.current = null;
    }

    const fetchMessages = async () => {
      if (!isMountedRef.current || cancelled) return;

      setLoading(true);

      try {
        let query = supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (appId) {
          query = query.eq('application_id', appId);
        } else {
          if (!isUuid(myId) || !isUuid(chatId)) {
            throw new Error('Invalid chat identity');
          }

          query = query
            .is('application_id', null)
            .or(
              `and(sender_id.eq.${myId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${myId})`
            );
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!cancelled && isMountedRef.current) {
          const safeMessages = (data || [])
            .map(sanitizeIncomingMessage)
            .filter(Boolean)
            .reverse();

          setMessages(safeMessages);
          setHasMore((data || []).length >= 50);
        }
      } catch {
        if (!cancelled && isMountedRef.current && showToast) {
          showToast('Unable to load chat history.', 'error');
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    const connectWebSocket = async () => {
      if (cancelled || !isMountedRef.current) return;

      try {
        if (!WORKER_URL) {
          throw new Error('Missing worker URL');
        }

        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (!session?.access_token) {
          throw new Error('Missing session');
        }

        const httpUrl = WORKER_URL.replace('wss://', 'https://').replace(
          'ws://',
          'http://'
        );

        const ticketRes = await fetch(`${httpUrl}/chat/ticket`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: roomId,
            chat_id: chatId,
            application_id: appId,
          }),
        });

        if (!ticketRes.ok) {
          throw new Error('Chat authentication failed');
        }

        const ticketPayload = await ticketRes.json();
        const ticket = ticketPayload?.ticket;

        if (!ticket) {
          throw new Error('Missing chat ticket');
        }

        const wsUrl = `${WORKER_URL}/chat/${encodeURIComponent(
          roomId
        )}?ticket=${encodeURIComponent(ticket)}`;

        const ws = new WebSocket(wsUrl);
        localWs = ws;
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttempts = 0;

          if (isMountedRef.current && !cancelled) {
            setIsConnected(true);
          }
        };

        ws.onerror = () => {
          if (isMountedRef.current && !cancelled) {
            setIsConnected(false);
          }
        };

        ws.onmessage = (event) => {
          if (cancelled || !isMountedRef.current) return;

          const parsed = safeJsonParse(event.data, null);
          const newMsg = sanitizeIncomingMessage(parsed);

          if (!newMsg) return;

          if (newMsg.error) {
            if (showToast) {
              showToast(`Chat error: ${newMsg.error}`, 'error');
            }
            return;
          }

          if (newMsg.system) return;

          if (newMsg.type === 'history') {
            const historyMessages = Array.isArray(parsed?.messages)
              ? parsed.messages.map(sanitizeIncomingMessage).filter(Boolean)
              : [];

            setMessages((prev) => {
              const existingIds = new Set(
                prev.map((m) => m.id || m.client_temp_id).filter(Boolean)
              );

              const uniqueHistory = historyMessages.filter((m) => {
                const identifier = m.id || m.client_temp_id;
                if (!identifier || existingIds.has(identifier)) return false;

                existingIds.add(identifier);
                return true;
              });

              return [...prev, ...uniqueHistory];
            });

            return;
          }

          setMessages((prev) => {
            if (newMsg.sender_id === myId && newMsg.client_temp_id) {
              return prev.map((msg) => {
                if (
                  msg.id === newMsg.client_temp_id ||
                  msg.client_temp_id === newMsg.client_temp_id
                ) {
                  return {
                    ...newMsg,
                    status: 'sent',
                    id: newMsg.id || newMsg.client_temp_id,
                  };
                }

                return msg;
              });
            }

            const exists = prev.some(
              (msg) =>
                msg.id === newMsg.id ||
                msg.id === newMsg.client_temp_id ||
                msg.client_temp_id === newMsg.client_temp_id
            );

            if (exists) return prev;

            return [...prev, newMsg];
          });
        };

        ws.onclose = (event) => {
          if (cancelled || !isMountedRef.current) return;

          setIsConnected(false);

          const normalClose = event.code === 1000;
          const policyClose = event.code === 1008;

          if (normalClose || policyClose) return;

          reconnectAttempts += 1;

          const baseDelay = Math.min(30000, 1500 * 2 ** reconnectAttempts);
          const jitter = Math.floor(Math.random() * 2000);
          const delay = baseDelay + jitter;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!cancelled && isMountedRef.current) {
              connectWebSocket();
            }
          }, delay);
        };
      } catch {
        if (!cancelled && isMountedRef.current) {
          setIsConnected(false);

          reconnectAttempts += 1;

          const delay = Math.min(30000, 2000 * reconnectAttempts);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!cancelled && isMountedRef.current) {
              connectWebSocket();
            }
          }, delay);
        }
      }
    };

    fetchMessages();
    connectWebSocket();

    return () => {
      cancelled = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (localWs) {
        localWs.close(1000, 'Chat changed');
      }

      if (wsRef.current === localWs) {
        wsRef.current = null;
      }
    };
  }, [chatId, myId, appId, roomId, showToast]);

  // =====================================================
  // 4. PAGINATION
  // =====================================================

  const loadMore = useCallback(async () => {
    if (!hasMore || !chatId || !myId) return;

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .range(messages.length, messages.length + 49);

      if (appId) {
        query = query.eq('application_id', appId);
      } else {
        if (!isUuid(myId) || !isUuid(chatId)) {
          throw new Error('Invalid chat identity');
        }

        query = query
          .is('application_id', null)
          .or(
            `and(sender_id.eq.${myId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${myId})`
          );
      }

      const { data, error } = await query;

      if (error) throw error;

      const safeMessages = (data || [])
        .map(sanitizeIncomingMessage)
        .filter(Boolean)
        .reverse();

      if ((data || []).length < 50) {
        setHasMore(false);
      }

      setMessages((prev) => {
        const existingIds = new Set(
          prev.map((m) => m.id || m.client_temp_id).filter(Boolean)
        );

        const uniqueMessages = safeMessages.filter((m) => {
          const identifier = m.id || m.client_temp_id;
          if (!identifier || existingIds.has(identifier)) return false;

          existingIds.add(identifier);
          return true;
        });

        return [...uniqueMessages, ...prev];
      });
    } catch {
      if (showToast) {
        showToast('Unable to load older messages.', 'error');
      }
    }
  }, [hasMore, chatId, myId, messages.length, appId, showToast]);

  // =====================================================
  // 5. BRUTAL SEND LOGIC
  // =====================================================

  const executeSendMessage = useCallback(async () => {
    const messageText = cleanVisibleText(input);

    if (!messageText || !chatId || !myId) return false;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (showToast) {
        showToast(BLOCK_REASONS.CONNECTION, 'error');
      }

      return false;
    }

    const blockedContent = detectBlockedContent(messageText);

    if (blockedContent.blocked) {
      registerViolation(myId, chatId, blockedContent.type);

      if (showToast) {
        showToast(blockedContent.reason, 'error');
      }

      return false;
    }

    const rateCheck = checkRateLimit(myId, chatId, messageText);

    if (!rateCheck.allowed) {
      registerViolation(myId, chatId, rateCheck.type || 'SPAM');

      if (showToast) {
        showToast(rateCheck.reason || BLOCK_REASONS.SPAM, 'error');
      }

      return false;
    }

    commitAllowedSend(myId, chatId, rateCheck.nextState);

    const tempId = `temp-${crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;

    const optimisticMsg = {
      id: tempId,
      client_temp_id: tempId,
      application_id: appId,
      sender_id: myId,
      receiver_id: chatId,
      content: messageText,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');

    const wsPayload = {
      client_temp_id: tempId,
      application_id: appId,
      receiver_id: chatId,
      content: messageText,
      sent_at: new Date().toISOString(),
    };

    try {
      wsRef.current.send(JSON.stringify(wsPayload));
      return true;
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                status: 'failed',
              }
            : msg
        )
      );

      if (showToast) {
        showToast('Message failed. Please try again.', 'error');
      }

      return false;
    }
  }, [input, chatId, myId, appId, showToast, setInput]);

  return {
    messages,
    input,
    setInput,
    loading,
    myId,
    executeSendMessage,
    loadMore,
    hasMore,
    isConnected,
  };
};
