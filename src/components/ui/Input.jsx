import React from 'react';
import { ChevronRight } from 'lucide-react';

const Input = ({ label, type = "text", ...props }) => (
  <div className="group">
    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    {type === 'textarea' ? (
      <textarea className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none transition-all resize-none min-h-[100px]" {...props}/>
    ) : type === 'select' ? (
      <div className="relative">
        <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none appearance-none" {...props}>
          {props.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><ChevronRight size={16} className="rotate-90"/></div>
      </div>
    ) : (
      <input type={type} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none" {...props}/>
    )}
  </div>
);

export default Input;