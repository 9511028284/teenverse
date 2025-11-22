import React from 'react';
import { X, CheckCircle } from 'lucide-react';

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in border-l-4 ${type === 'error' ? 'bg-white dark:bg-gray-800 border-red-500 text-red-600 dark:text-red-400' : 'bg-white dark:bg-gray-800 border-emerald-500 text-emerald-600 dark:text-emerald-400'}`}>
    {type === 'error' ? <X size={18} /> : <CheckCircle size={18} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X size={14}/></button>
  </div>
);

export default Toast;