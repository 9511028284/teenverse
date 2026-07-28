import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, ChevronRight, Video, ExternalLink, Gift } from 'lucide-react';
import { fetchActiveMarketingEvent, trackMarketingEvent } from '../../services/marketingEvents.api';

const REWARD_AMOUNT = 300;
const REWARD_LABEL = 'Wallet Cash';

const formatReward = (amount) => `₹${(Number(amount) || 0).toLocaleString()}`;

function triggerHaptic() {
  try { navigator.vibrate?.(12); } catch {}
}

function useConfetti(canvasRef, active) {
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    const PARTICLE_COUNT = 120;

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.6,
      w: 4 + Math.random() * 6,
      h: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
    }));

    let frame;
    let startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed > 4000) {
        particlesRef.current.forEach((p) => { p.opacity = Math.max(0, p.opacity - 0.02); });
        if (particlesRef.current.every((p) => p.opacity <= 0)) return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        if (p.opacity <= 0) return;
        p.x += p.vx;
        p.vy += 0.04;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity * Math.max(0, Math.min(1, (4000 - elapsed) / 800));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [active, canvasRef]);
}

function FloatingIllustration() {
  return (
    <div className="relative w-full h-48 sm:h-56 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 400 200" className="w-full h-full" fill="none">
        <defs>
          <linearGradient id="fg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="fg2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="fg3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Floating rings */}
        <motion.circle
          cx="200" cy="100" r="72"
          stroke="url(#fg1)" strokeWidth="1.5"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [0.9, 1.05, 0.95, 1], opacity: [0, 0.8, 0.6, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="200" cy="100" r="56"
          stroke="url(#fg2)" strokeWidth="1"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: [1.1, 0.95, 1.05, 1], opacity: [0, 0.6, 0.4, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Social media-like icons */}
        <motion.g
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: [0, -6, 0], opacity: 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="152" y="78" width="16" height="16" rx="4" fill="url(#fg1)" />
          <rect x="158" y="82" width="4" height="4" rx="1" fill="white" fillOpacity="0.3" />
        </motion.g>

        <motion.g
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: [0, 6, 0], opacity: 1 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        >
          <rect x="226" y="74" width="18" height="18" rx="5" fill="url(#fg2)" />
          <path d="M232 80v6l4-3-4-3z" fill="white" fillOpacity="0.3" />
        </motion.g>

        <motion.g
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: [0, -4, 2, 0], opacity: 1 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <circle cx="200" cy="108" r="10" fill="url(#fg3)" />
          <circle cx="200" cy="108" r="4" fill="white" fillOpacity="0.2" />
        </motion.g>

        {/* Subtle stars/dots */}
        {[[170, 62], [232, 60], [156, 130], [244, 126], [186, 140]].map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x} cy={y} r="1.5"
            fill="currentColor"
            className="text-indigo-400/40 dark:text-indigo-300/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}

        {/* Connection lines */}
        <motion.line
          x1="160" y1="86" x2="226" y2="83"
          stroke="url(#fg2)" strokeWidth="0.5" strokeDasharray="3 3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
      </svg>
    </div>
  );
}

function RequirementItem({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mt-0.5">
        <Check size={10} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function MarketingCampaign() {
  const canvasRef = useRef(null);
  const [state, setState] = useState({
    event: null,
    hasSeenModal: true,
    submission: null,
    reward: null,
    loading: true,
    showModal: false,
    confettiDone: false,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchActiveMarketingEvent();
        if (!mounted) return;
        const hasActive = data?.event && !data?.hasSeenModal;
        setState((prev) => ({
          ...prev,
          event: data?.event || null,
          hasSeenModal: data?.hasSeenModal !== false,
          submission: data?.submission || null,
          reward: data?.reward || null,
          loading: false,
          showModal: hasActive,
          confettiDone: !hasActive,
        }));
        if (hasActive) {
          triggerHaptic();
          trackMarketingEvent({ viewType: 'modal_open', intent: 'auto_show', source: 'dashboard' }).catch(() => {});
        }
      } catch {
        if (mounted) setState((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useConfetti(canvasRef, state.showModal);

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, showModal: false }));
    if (state.event) {
      trackMarketingEvent({ viewType: 'dismiss', intent: 'user_dismissed', source: 'dashboard' }).catch(() => {});
      trackMarketingEvent({ viewType: 'seen', intent: 'seen_on_dismiss', source: 'dashboard' }).catch(() => {});
    }
  }, [state.event]);

  const handleJoin = useCallback(() => {
    if (state.event) {
      trackMarketingEvent({ viewType: 'join', intent: 'user_joined', source: 'dashboard' }).catch(() => {});
      triggerHaptic();
    }
    dismiss();
  }, [state.event, dismiss]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') dismiss();
  }, [dismiss]);

  if (state.loading || !state.showModal || !state.event) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="marketing-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xl"
        onClick={dismiss}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Marketing campaign announcement"
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        />

        <motion.div
          key="marketing-modal"
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ type: 'spring', duration: 0.55, bounce: 0.32 }}
          onClick={(e) => e.stopPropagation()}
          className={`
            relative w-full max-w-lg
            bg-white/90 dark:bg-slate-900/90
            backdrop-blur-2xl
            rounded-[24px]
            border border-white/40 dark:border-white/[0.06]
            shadow-[0_32px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.02)_inset]
            dark:shadow-[0_32px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)_inset]
            overflow-hidden
            max-h-[90vh] overflow-y-auto
          `}
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Ambient glow orbs */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-400/8 rounded-full blur-[80px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 bg-purple-500/8 dark:bg-purple-400/6 rounded-full blur-[70px]" aria-hidden="true" />

          {/* Close button */}
          <button
            onClick={dismiss}
            className={`
              absolute top-4 right-4 z-20
              flex h-8 w-8 items-center justify-center
              rounded-full
              bg-white/70 dark:bg-slate-800/70
              border border-slate-200/60 dark:border-white/[0.06]
              text-slate-400 dark:text-slate-500
              hover:text-slate-600 dark:hover:text-slate-300
              hover:bg-white dark:hover:bg-slate-700
              backdrop-blur-md
              transition-all duration-200
              shadow-sm
            `}
            aria-label="Close"
          >
            <X size={15} strokeWidth={2} />
          </button>

          {/* Illustration */}
          <div className="pt-6 sm:pt-8 px-6 sm:px-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/30 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                <Sparkles size={10} />
                Launch Event
              </span>
            </div>
            <FloatingIllustration />
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-2">
              Create a TeenVerseHub Video & Earn {formatReward(REWARD_AMOUNT)} {REWARD_LABEL}
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-5">
              Help us spread the word about TeenVerseHub and get rewarded! Create a short, original video introducing TeenVerseHub and publish it on your social media account. Once your submission is reviewed and approved, you&rsquo;ll receive {formatReward(REWARD_AMOUNT)} {REWARD_LABEL}.
            </p>

            {/* What to mention */}
            <div className="mb-5 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
                What to mention in your video
              </p>
              <ul className="space-y-2">
                {[
                  "TeenVerseHub is India's freelancing platform built for teenagers and young adults (ages 14–25).",
                  'It helps students gain real-world experience before college or full-time jobs.',
                  'Users can build professional portfolios while working on real client projects.',
                  'Beginners are welcome — skills can be learned while earning.',
                  'TeenVerseHub provides a safe environment for young freelancers.',
                  'Follow @teenversehub.in on Instagram and tag us in your video.',
                  'Encourage viewers to join TeenVerseHub and start their freelancing journey.',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-200/60 dark:bg-indigo-700/40 mt-0.5">
                      <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-300">{i + 1}</span>
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="mb-5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Requirements
              </p>
              <ul className="space-y-1.5">
                <RequirementItem>Create an original video.</RequirementItem>
                <RequirementItem>
                  Upload it publicly on Instagram Reels, YouTube Shorts, Facebook Reels, or other supported short-video platforms.
                </RequirementItem>
                <RequirementItem>Tag @teenversehub.in on Instagram (or the official TeenVerseHub handle on other platforms).</RequirementItem>
                <RequirementItem>Keep the video public until the review is completed.</RequirementItem>
              </ul>
            </div>

            {/* Reward card */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Gift size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Reward
                </p>
                <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
                  {formatReward(REWARD_AMOUNT)} {REWARD_LABEL}
                </p>
                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
                  Credited after manual verification and approval
                </p>
              </div>
            </div>

            {/* CTAs */}
            <button
              onClick={handleJoin}
              className="
                group relative w-full
                flex items-center justify-center gap-2
                py-3.5 px-5
                rounded-2xl
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                font-semibold text-sm
                shadow-[0_8px_24px_rgba(0,0,0,0.12)]
                dark:shadow-[0_8px_24px_rgba(255,255,255,0.08)]
                hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)]
                dark:hover:shadow-[0_12px_32px_rgba(255,255,255,0.12)]
                hover:-translate-y-0.5
                active:translate-y-0
                active:scale-[0.98]
                transition-all duration-200
                overflow-hidden
              "
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/10 to-indigo-500/0 dark:from-white/0 dark:via-slate-900/10 dark:to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Video size={16} />
              <span>Join Event</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={dismiss}
              className="
                mt-2.5 w-full
                flex items-center justify-center gap-1.5
                py-2.5 px-4
                rounded-2xl
                text-xs font-medium
                text-slate-400 dark:text-slate-500
                hover:text-slate-600 dark:hover:text-slate-300
                hover:bg-slate-100/50 dark:hover:bg-white/[0.03]
                transition-all duration-200
              "
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MarketingCampaign;
