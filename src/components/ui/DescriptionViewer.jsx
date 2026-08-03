import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const isStructuredDescription = (text = '') => {
  if (!text) return false;
  if (text.length > 350) return true;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length >= 3;
};

const renderDescription = (text) => {
  const lines = (text || '').split(/\r?\n/).map((l) => l.replace(/\*\*/g, '').trim());
  const out = [];
  let bullets = [];

  const flushBullets = (key) => {
    if (bullets.length) {
      out.push(
        <ul key={key} className="space-y-2 my-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium">{b}</span>
            </li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };

  lines.forEach((line, i) => {
    if (!line) return;

    let isHeading = false;
    let headingText = line;

    const mdHeading = line.match(/^#{1,3}\s+(.+)/);
    if (mdHeading) {
      headingText = mdHeading[1];
      isHeading = true;
    } else if (line.endsWith(':') && line.length < 60 && /^[A-Z]/.test(line)) {
      headingText = line.replace(/:$/, '');
      isHeading = true;
    } else if (/^[A-Z0-9][A-Z0-9 &/:-]{2,49}$/.test(line) && line.length < 60 && !/[a-z]{2}/.test(line)) {
      isHeading = true;
    }

    const bullet = line.match(/^[-•*›▪◦]\s+(.+)/) || line.match(/^(?:\d{1,2}[.)]\s+)(.+)/);

    if (isHeading) {
      flushBullets(`b-${i}`);
      out.push(
        <h4 key={`h-${i}`} className="text-[12px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mt-4 first:mt-0">
          {headingText.replace(/[#*]/g, '')}
        </h4>
      );
      return;
    }

    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }

    flushBullets(`b-${i}`);
    out.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
        {line}
      </p>
    );
  });

  flushBullets('b-end');

  if (!out.length) {
    out.push(
      <p key="empty" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium italic">
        {text}
      </p>
    );
  }

  return <div className="space-y-2.5">{out}</div>;
};

const TrafficLight = ({ onClick }) => (
  <div className="flex items-center gap-[7px]">
    <button
      onClick={onClick}
      aria-label="Close"
      className="group w-[13px] h-[13px] rounded-full bg-[#ff5f57] ring-1 ring-black/10 transition-shadow"
    >
      <span className="block w-full h-full rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-[#8a2a21] text-[10px] leading-none text-center items-center justify-center hidden">✕</span>
    </button>
    <span className="w-[13px] h-[13px] rounded-full bg-[#febc2e] ring-1 ring-black/10" />
    <span className="w-[13px] h-[13px] rounded-full bg-[#28c840] ring-1 ring-black/10" />
  </div>
);

const DescriptionViewer = ({ title = 'Project Brief', badge = 'Full Details', description, onClose }) => {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-8"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/45 backdrop-blur-md"
          onClick={onClose}
        />

        {/* macOS Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl max-h-[86vh] flex flex-col overflow-hidden rounded-[22px] border border-black/10 dark:border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.45)] bg-white/85 dark:bg-[#242424]/90 backdrop-blur-2xl"
        >
          {/* Title Bar */}
          <div className="relative flex items-center gap-4 px-4 h-[52px] shrink-0 border-b border-black/10 dark:border-white/10 bg-gradient-to-b from-white/90 to-white/70 dark:from-[#333]/95 dark:to-[#2a2a2a]/95">
            <div className="absolute inset-x-0 top-0 h-px bg-white/60 dark:bg-white/10" />
            <TrafficLight onClick={onClose} />
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center pr-14">
              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate">{title || 'Project Brief'}</span>
            </div>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {badge}
            </span>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-grow bg-white/60 dark:bg-transparent">
            {renderDescription(description)}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default DescriptionViewer;