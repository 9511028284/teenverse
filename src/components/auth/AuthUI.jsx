import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldAlert, Scale, ArrowLeft } from 'lucide-react';

export const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div 
         initial={{ opacity: 0, y: -20, x: 20 }}
         animate={{ opacity: 1, y: 0, x: 0 }}
         exit={{ opacity: 0, x: 20 }}
         className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
         {toast.type === 'success' ? <Check size={20}/> : <ShieldAlert size={20}/>}
         <span className="font-bold text-sm">{toast.message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

export const StepIndicator = ({ step }) => (
    <div className="flex gap-2 mb-8 justify-center">
        {[1, 2, 3, 4].map(i => (
            <motion.div key={i} layout className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-2 bg-gray-800'}`} />
        ))}
    </div>
);

export const SocialButton = ({ icon, onClick, label }) => (
    <button type="button" onClick={onClick} className="flex-1 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 p-4 rounded-xl flex justify-center items-center transition-all duration-300 group relative overflow-hidden" title={label}>
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative transform group-hover:scale-110 transition-transform">{icon}</div>
    </button>
);

export const FloatingNotif = ({ icon: Icon, title, sub, delay, x, y }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20, x: 0 }}
        animate={{ opacity: [0, 1, 1, 0], y: [0, -10, -10, -20], x: [0, x, x, x + 10] }}
        transition={{ duration: 5, delay: delay, repeat: Infinity, repeatDelay: 8 }}
        className="absolute z-20 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex items-center gap-3 shadow-2xl w-48 pointer-events-none"
        style={{ top: y, left: x }}
    >
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white"><Icon size={14} /></div>
        <div>
            <div className="text-[10px] font-bold text-gray-300 uppercase">{title}</div>
            <div className="text-xs font-bold text-white">{sub}</div>
        </div>
    </motion.div>
);

export const BackButton = ({ onClick, label = "Back" }) => (
    <button onClick={onClick} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 text-sm font-bold transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> {label}
    </button>
);

export const LegalFooter = ({ mobile }) => (
    <div className={`mt-8 pt-6 border-t border-white/10 text-[10px] text-gray-500 leading-tight ${mobile ? 'md:hidden' : 'hidden md:block'}`}>
        <p className="mb-2 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity cursor-default">
            <Scale size={10} className="text-indigo-400"/> Legal Protocol: TeenVerseHub is a technology intermediary.
        </p>
        <p className="opacity-50">© 2025 TeenVerse Protocol. All rights secured.</p>
    </div>
);