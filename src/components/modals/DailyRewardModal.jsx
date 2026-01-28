import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Zap, X } from 'lucide-react';
import Button from '../ui/Button'; // Ensure this path matches your project structure

const DailyRewardModal = ({ isOpen, onClaim, onClose, amount = 10 }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-[#0F172A] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-indigo-100 dark:border-white/10 overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-50 to-transparent dark:from-amber-900/10 pointer-events-none" />
          
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>

          <motion.div 
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative z-10 w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
          >
            <Sun size={48} className="text-amber-500 drop-shadow-lg" />
          </motion.div>

          <h3 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-white mb-2">Daily Check-in!</h3>
          <p className="relative z-10 text-sm text-gray-500 dark:text-gray-400 mb-6">
            Welcome back! Here is your daily energy boost to keep hustling.
          </p>

          <div className="relative z-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-full">
              <Zap className="text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" size={24} />
            </div>
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">+{amount}</span>
          </div>

          <Button 
            onClick={onClaim} 
            className="w-full py-4 text-lg font-bold shadow-xl shadow-indigo-500/20 relative z-10"
          >
            Claim Energy ⚡
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyRewardModal;