import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldAlert, Scale, ArrowLeft } from 'lucide-react';

// --- 1. PREMIUM DYNAMIC TOAST ---
export const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div 
         initial={{ opacity: 0, y: -40, scale: 0.8, filter: "blur(10px)" }}
         animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
         exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(10px)" }}
         transition={{ type: "spring", stiffness: 400, damping: 25 }}
         className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[100] w-[90%] md:w-auto"
      >
        <div className={`
          px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 backdrop-blur-2xl transition-colors duration-300
          ${toast.type === 'success' 
            ? 'bg-green-50/90 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 shadow-green-500/20' 
            : 'bg-red-50/90 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 shadow-red-500/20'
          }
        `}>
           <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
             {toast.type === 'success' ? <Check size={20} strokeWidth={3} /> : <ShieldAlert size={20} strokeWidth={3} />}
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">
               {toast.type === 'success' ? 'System Success' : 'System Alert'}
             </p>
             <span className="font-bold text-sm leading-tight block">{toast.message}</span>
           </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- 2. SEGMENTED STEP INDICATOR ---
export const StepIndicator = ({ step }) => (
    <div className="flex gap-2 mb-8 justify-center items-center">
        {[1, 2, 3, 4].map(i => (
            <motion.div 
                key={i} 
                layout 
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`h-2 rounded-full transition-colors duration-500 relative overflow-hidden ${
                    step === i 
                        ? 'w-12 bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                        : step > i 
                            ? 'w-8 bg-indigo-300 dark:bg-indigo-900' 
                            : 'w-2 bg-slate-200 dark:bg-white/10'
                }`}
            >
                {/* Glossy shine effect for active step */}
                {step === i && (
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                    />
                )}
            </motion.div>
        ))}
    </div>
);

// --- 3. TACTILE SOCIAL BUTTON ---
export const SocialButton = ({ icon, onClick, label }) => (
    <button 
      type="button" 
      onClick={onClick} 
      title={label}
      className="flex-1 bg-black dark:bg-white/9 border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/10 p-4 rounded-2xl flex justify-center items-center transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-lg dark:shadow-none active:scale-95" 
    >
        {/* Hover Aura */}
        <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative transform group-hover:-translate-y-1 transition-transform duration-300">{icon}</div>
    </button>
);

// --- 4. VISION PRO STYLE FLOATING NOTIF ---
// (Now supports a 3D icon URL for maximum aesthetic)
export const FloatingNotif = ({ icon: Icon, image3DUrl, title, sub, delay, x, y }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
        animate={{ 
            opacity: [0, 1, 1, 0], 
            scale: [0.8, 1, 1, 0.9],
            y: [0, -15, -15, -30], 
            x: [0, x, x, x + 20],
            filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(10px)"]
        }}
        transition={{ duration: 6, delay: delay, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
        className="absolute z-20 bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 p-3 rounded-3xl flex items-center gap-4 shadow-2xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] w-56 pointer-events-none"
        style={{ top: y, left: x }}
    >
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-600/20 rounded-2xl border border-white/50 dark:border-white/10 shadow-inner">
            {image3DUrl ? (
                <img src={image3DUrl} alt="icon" className="w-10 h-10 object-contain drop-shadow-md" />
            ) : (
                <Icon size={20} className="text-indigo-600 dark:text-indigo-400" />
            )}
        </div>
        <div className="flex flex-col">
            <div className="text-[9px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest">{title}</div>
            <div className="text-sm font-bold text-slate-800 dark:text-white leading-tight mt-0.5">{sub}</div>
        </div>
    </motion.div>
);

// --- 5. EDITORIAL BACK BUTTON ---
export const BackButton = ({ onClick, label = "Return" }) => (
    <button 
      onClick={onClick} 
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 mb-8 text-xs font-black uppercase tracking-widest transition-all group active:scale-95 shadow-sm"
    >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300"/> {label}
    </button>
);

// --- 6. CYBERPUNK / BLUEPRINT FOOTER ---
export const LegalFooter = ({ mobile }) => (
    <div className={`mt-8 pt-6 border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-gray-500 leading-tight font-mono uppercase tracking-wide ${mobile ? 'md:hidden' : 'hidden md:block'}`}>
        <div className="flex items-center gap-2 mb-3 opacity-80 hover:opacity-100 transition-opacity cursor-default group">
            <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Scale size={12} />
            </div>
            <span>
                <span className="font-bold text-slate-700 dark:text-gray-300">Legal Protocol: </span> TeenVerseHub is a technology intermediary
            </span>
        </div>
        <p className="opacity-50">© 2026 TeenVerseHub Matrix. All rights secured via cryptographic hash.</p>
    </div>
);