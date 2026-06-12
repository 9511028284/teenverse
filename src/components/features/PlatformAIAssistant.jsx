import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  ChevronDown,
  HelpCircle,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
  ArrowRight,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { supabase } from '../../supabase';
import { getEffectivePlanName } from '../../utils/subscription';

const STATIC_QUICK_PROMPTS = [
  'Why can I not apply to this job?',
  'My payment succeeded but plan is Basic.',
  'How does escrow protect clients?',
  'Why does my submitted work need revision?',
  'How do I improve my profile portfolio?',
  'What should I do if KYC is pending?',
];

const cx = (...classes) => classes.filter(Boolean).join(' ');
const ASSISTANT_POSITION_KEY = 'teenverse_ai_assistant_position_v1';

const getDefaultPosition = () => ({
  right: typeof window === 'undefined' || window.innerWidth < 640 ? 16 : 24,
  bottom: typeof window === 'undefined' || window.innerWidth < 640 ? 16 : 24,
});

const getStoredPosition = () => {
  if (typeof window === 'undefined') return getDefaultPosition();

  try {
    const stored = JSON.parse(window.localStorage.getItem(ASSISTANT_POSITION_KEY) || 'null');
    if (Number.isFinite(stored?.right) && Number.isFinite(stored?.bottom)) {
      return stored;
    }
  } catch {
    return getDefaultPosition();
  }

  return getDefaultPosition();
};

const clampPosition = (position, open = false) => {
  if (typeof window === 'undefined') return position;

  const margin = 8;
  const assistantWidth = open ? Math.min(400, window.innerWidth - 32) : (window.innerWidth >= 640 ? 220 : 64);
  const maxRight = Math.max(margin, window.innerWidth - assistantWidth - margin);
  const maxBottom = open ? 40 : Math.max(margin, window.innerHeight - 72);

  return {
    right: Math.min(Math.max(position.right, margin), maxRight),
    bottom: Math.min(Math.max(position.bottom, margin), maxBottom),
  };
};

const getAssistantErrorMessage = (data, error) => {
  const raw = data?.error || error?.message || 'Assistant is unavailable right now.';

  if (/daily ai assistant limit/i.test(raw)) return 'Daily AI assistant limit reached. Upgrade your plan for more questions.';
  if (/weekly ai assistant limit/i.test(raw)) return 'Weekly AI assistant limit reached. Upgrade your plan for more questions.';
  if (/monthly ai assistant/i.test(raw)) return 'Monthly AI assistant fair-use limit reached.';
  if (/api[_\s-]?key|not configured|missing/i.test(raw)) return 'Assistant is not configured yet. Please contact support.';
  if (/unauthorized/i.test(raw)) return 'Please sign in again to use the assistant.';

  return raw;
};

const readFunctionErrorPayload = async (error) => {
  if (!error?.context || typeof error.context.clone !== 'function') return null;

  try {
    return await error.context.clone().json();
  } catch {
    return null;
  }
};

const buildConversationPrompt = (messages, nextMessage) => {
  const recent = messages
    .filter((item) => item.role === 'user' || item.role === 'assistant')
    .slice(-6)
    .map((item) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`)
    .join('\n');

  if (!recent) return nextMessage;

  return `
Recent conversation:
${recent}

Latest user message:
${nextMessage}

Note for Assistant: End your answer by asking 1 or 2 hyper-relevant, engaging follow-up questions to keep the user exploring their options or fixing their problem.
`.trim();
};

// --- HELPER: EXTRACT DYNAMIC QUESTIONS FROM AI RESPONSES FOR HIGH-ENGAGEMENT PILLS ---
const parseAiResponse = (text) => {
  if (!text) return { cleanText: '', questions: [] };
  
  // Regex to capture standalone questions ending in a question mark
  const questionRegex = /([^.!?]*\?)/g;
  const matches = text.match(questionRegex) || [];
  
  if (matches.length === 0) {
    return { cleanText: text, questions: [] };
  }

  // Take the last 2 questions as dynamic quick follow-ups if they appear at the end
  const extractedQuestions = matches
    .map(q => q.trim())
    .filter(q => q.length > 10 && q.length < 90)
    .slice(-2);

  let cleanText = text;
  extractedQuestions.forEach(q => {
    cleanText = cleanText.replace(q, '');
  });

  cleanText = cleanText.trim().replace(/[\s\n\r]+$/, '');

  return {
    cleanText: cleanText || text,
    questions: extractedQuestions
  };
};

const PlatformAIAssistant = ({ user, showToast }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHiddenByArea, setIsHiddenByArea] = useState(false);
  const [position, setPosition] = useState(() => getStoredPosition());
  
  // Seed with an initial highly engaging welcome message hook
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hey there! I am your TeenVerseHub Copilot. 🚀 Stuck on something? Tell me what you are working on, and let’s get it fixed step by step.',
      suggestedQuestions: [
        'How do I earn my first skill badge? 🎖️',
        'How does the secure escrow system protect my earnings? 🔒'
      ]
    },
  ]);
  
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);
  const plan = useMemo(() => getEffectivePlanName(user), [user]);

  // Dynamically compute the active question feed based on the latest AI message state
  const currentQuickPrompts = useMemo(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && !m.tone);
    if (lastAssistantMessage?.suggestedQuestions && lastAssistantMessage.suggestedQuestions.length > 0) {
      return lastAssistantMessage.suggestedQuestions;
    }
    return STATIC_QUICK_PROMPTS;
  }, [messages]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      window.setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages, loading]);

  useEffect(() => {
    const handleVisibility = (event) => {
      const shouldHide = Boolean(event.detail?.hidden);
      setIsHiddenByArea(shouldHide);
      if (shouldHide) setOpen(false);
    };

    window.addEventListener('teenverse:copilot-visibility', handleVisibility);
    return () => window.removeEventListener('teenverse:copilot-visibility', handleVisibility);
  }, []);

  useEffect(() => {
    const nextPosition = clampPosition(position, open);
    if (nextPosition.right !== position.right || nextPosition.bottom !== position.bottom) {
      setPosition(nextPosition);
    }
  }, [open, position]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev, open));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  useEffect(() => {
    window.localStorage.setItem(ASSISTANT_POSITION_KEY, JSON.stringify(position));
  }, [position]);

  if (!user?.id || isHiddenByArea) return null;

  const startDrag = (event) => {
    if (event.button !== 0) return;

    dragMovedRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRight: position.right,
      startBottom: position.bottom,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragMovedRef.current = true;

    setPosition(clampPosition({
      right: drag.startRight - dx,
      bottom: drag.startBottom - dy,
    }, open));
  };

  const stopDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  };

  const toggleAssistant = (event) => {
    if (dragMovedRef.current) {
      event.preventDefault();
      dragMovedRef.current = false;
      return;
    }

    setOpen((prev) => !prev);
  };

  const sendMessage = async (messageText = input) => {
    const text = String(messageText || '').trim();
    if (!text || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const prompt = buildConversationPrompt(messages, text);
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          userId: user.id,
          message: prompt,
          name: user.name || user.email || 'TeenVerseHub user',
          role: user.type || 'user',
          plan,
          route: location.pathname,
        },
      });

      if (error) {
        const functionPayload = await readFunctionErrorPayload(error);
        throw new Error(getAssistantErrorMessage(data || functionPayload, error));
      }

      if (!data?.success) {
        throw new Error(getAssistantErrorMessage(data, null));
      }

      const answer = data?.data?.answer || data?.data?.message || 'I could not generate a useful answer. Please try again.';
      
      // Parse the response to split the core response text from suggested follow-ups
      const parsed = parseAiResponse(answer);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: parsed.cleanText,
          suggestedQuestions: parsed.questions,
          model: data?.data?.model,
          provider: data?.data?.provider,
        },
      ]);
    } catch (error) {
      const friendly = getAssistantErrorMessage(null, error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          tone: 'error',
          content: friendly,
        },
      ]);
      showToast?.(friendly, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div
      className="fixed z-[90] font-sans antialiased"
      style={{ right: `${position.right}px`, bottom: `${position.bottom}px` }}
    >
      {open && (
        <div className="mb-4 flex h-[min(680px,calc(100dvh-112px))] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-[32px] border border-white bg-white/95 text-slate-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_24px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-white/[0.05] dark:bg-[#090D1A]/95 dark:text-white dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.08),_0_24px_60px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out animate-fade-in">
          
          {/* --- TOP HEADER MODAL BANNER --- */}
          <div
            className="relative cursor-grab touch-none select-none overflow-hidden border-b border-slate-100 bg-slate-950 px-5 py-4.5 text-white active:cursor-grabbing dark:border-white/[0.04]"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.3),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.15),transparent_35%)]" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {/* Claymorphic Robot Icon Wrapper */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.2)]">
                  <Bot size={22} strokeWidth={2.5} className="drop-shadow-[0_2px_4px_rgba(34,211,238,0.3)] animate-pulse" />
                </div>
                <div className="min-w-0 text-left">
                  <h2 className="truncate text-base font-black tracking-tight flex items-center gap-1.5">
                    TeenVerse AI <Sparkles size={13} className="text-amber-400 fill-amber-400" />
                  </h2>
                  <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {user.type || 'platform'} pilot • <span className="text-indigo-400">{plan}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                onPointerDown={(event) => event.stopPropagation()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close AI assistant"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* --- SCROLLABLE CHAT PLATFORM SPACE --- */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-slate-950/20">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={cx('flex flex-col w-full animate-fade-in-up', isUser ? 'items-end' : 'items-start')}>
                  <div
                    className={cx(
                      'max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] px-4 py-3 text-sm font-bold leading-relaxed shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] text-left',
                      isUser
                        ? 'rounded-br-sm bg-indigo-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)] dark:bg-indigo-500'
                        : message.tone === 'error'
                          ? 'rounded-bl-sm border border-red-100 bg-red-50 text-red-700 dark:border-red-500/10 dark:bg-red-500/5 dark:text-red-400 shadow-none'
                          : 'rounded-bl-sm border border-slate-200/60 bg-white text-slate-700 shadow-sm dark:border-white/[0.04] dark:bg-slate-900/60 dark:text-slate-200 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.8)] dark:shadow-none'
                    )}
                  >
                    {message.content}
                  </div>
                  
                  {/* Inline micro questions right below the message context */}
                  {!isUser && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5 w-full pl-2 text-left animate-fade-in">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <QuestionIcon size={10} /> Dynamic suggestions:
                      </p>
                      {message.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => sendMessage(q)}
                          disabled={loading}
                          className="w-fit text-left text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 decoration-2 underline-offset-2 transition-all"
                        >
                          <ArrowRight size={10} strokeWidth={3} className="shrink-0" /> {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-center gap-2 rounded-[18px] rounded-bl-sm border border-slate-200/60 bg-white px-4 py-2.5 text-xs font-black text-slate-400 shadow-sm dark:border-white/[0.04] dark:bg-slate-900/60 dark:text-slate-400">
                  <Loader2 size={13} className="animate-spin text-indigo-500 dark:text-indigo-400" strokeWidth={2.5} />
                  Analyzing context...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* --- INTERACTIVE ACTION INPUT CAPTURE ROWS --- */}
          <div className="border-t border-slate-100 bg-white/90 p-4 dark:border-white/[0.04] dark:bg-[#090D1A]/90 backdrop-blur-md">
            
            {/* Horizontal Prompts Stream (Scrollable) */}
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mask-linear-r select-none">
              {currentQuickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-[11px] font-black text-slate-600 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),_0_2px_4px_rgba(0,0,0,0.01)] hover:border-indigo-500/20 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:opacity-40 dark:border-white/[0.04] dark:bg-slate-900 dark:text-slate-400 dark:shadow-none dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2 text-left">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about credentials, jobs, escrow logs..."
                rows={1}
                className="max-h-24 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-900 outline-none transition focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 dark:border-white/[0.05] dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_6px_16px_rgba(79,70,229,0.25)] transition-all duration-200 hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]"
                aria-label="Send query"
              >
                {loading ? <Loader2 size={16} className="animate-spin" strokeWidth={2.5} /> : <Send size={15} strokeWidth={2.5} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- FLOATING TRIGGER EMBEDDED BUTTON PILL --- */}
      <button
        type="button"
        onClick={toggleAssistant}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        className="group flex min-h-[56px] cursor-grab touch-none select-none items-center gap-3 rounded-[22px] border border-slate-900 bg-slate-950 px-4 py-2.5 text-white shadow-[0_16px_36px_rgba(7,10,20,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(79,70,229,0.4)] active:cursor-grabbing dark:border-white/10 dark:bg-slate-900"
        aria-expanded={open}
        aria-label={open ? 'Minimize AI assistant' : 'Open AI assistant'}
      >
        <span className="flex h-9 h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-300 transition-colors group-hover:bg-white/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
          {open ? <ChevronDown size={20} strokeWidth={2.5} /> : <MessageCircle size={18} strokeWidth={2.5} />}
        </span>
        <span className="hidden text-left sm:block">
          <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider">
            AI Pilot <Sparkles size={12} className="text-amber-400 fill-amber-400 animate-pulse" />
          </span>
          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Ecosystem Copilot</span>
        </span>
        <HelpCircle size={16} className="hidden text-slate-500 sm:block ml-1" />
      </button>
    </div>
  );
};

export default PlatformAIAssistant;
