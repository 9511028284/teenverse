import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Zap, X } from 'lucide-react';
import Button from '../ui/Button';

const DailyRewardModal = ({ isOpen, onClaim, onClose, amount = 10, isClaiming = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden select-none"
          >
            {/* Ambient Rotating Glow Background Aura */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60%] pointer-events-none overflow-hidden opacity-70 dark:opacity-40">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                className="w-full h-full bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_60%)] bg-[conic-gradient(from_0deg,transparent_0%,rgba(245,158,11,0.1)_10%,transparent_20%,rgba(245,158,11,0.1)_40%,transparent_50%)]"
              />
            </div>
            
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            {/* Dynamic Animated Trophy Badge */}
            <div className="relative z-10 w-28 h-28 mx-auto mb-4 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-sm"
              />
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative w-20 h-20 bg-gradient-to-b from-amber-400 to-amber-500 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(245,158,11,0.3)] rotate-[12deg]"
              >
                <Sun size={40} className="fill-white/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-lg border-2 border-white dark:border-slate-900 shadow-md">
                  <Zap size={14} className="fill-current" />
                </div>
              </motion.div>
            </div>

            {/* Header Text */}
            <h3 className="relative z-10 text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-1">Daily Check-In!</h3>
            <p className="relative z-10 text-xs font-medium text-slate-400 dark:text-slate-500 max-w-xs mx-auto mb-6">
              Welcome back! Claim your energy boost to keep creating today.
            </p>

            {/* Clean, Authentic Reward Display Panel */}
            <div className="relative z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-5 mb-6 flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Energy Confirmed</span>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  +{amount}
                </span>
                <span className="text-2xl animate-pulse">⚡</span>
              </div>
            </div>

            {/* Interactive Primary Claim Button Wrapper */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative z-10">
              <Button 
                onClick={onClaim} 
                disabled={isClaiming}
                className="w-full py-4 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl transition-all shadow-xl shadow-indigo-600/20 dark:shadow-indigo-500/10"
              >
                {isClaiming ? 'Dropping Reward...' : 'Claim Energy Now'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyRewardModal;