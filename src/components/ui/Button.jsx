import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const Button = ({ children, variant = 'primary', className = '', onClick, disabled, icon: Icon }) => {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 dark:shadow-none",
    secondary: "bg-white text-indigo-600 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-gray-700 dark:text-indigo-400 dark:hover:bg-gray-700",
    outline: "bg-transparent border border-gray-300 text-gray-600 hover:border-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border-transparent dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none",
    payment: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-200 dark:shadow-none",
    ai: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
     };
  return (
    <button onClick={onClick} disabled={disabled} className={`relative px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {disabled ? <Loader2 size={18} className="animate-spin"/> : Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export default Button;




