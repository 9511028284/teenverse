import React from 'react';
import { ChevronRight } from 'lucide-react';

const Input = ({ label, type = "text", ...props }) => (
  <div className="group relative w-full mb-6">
    <div className="relative">
      {type === 'textarea' ? (
        <textarea 
          className="peer w-full bg-black/20 text-gray-100 border-2 border-white/5 rounded-2xl px-5 py-4 pt-6 focus:bg-black/40 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] outline-none transition-all duration-300 placeholder-transparent min-h-[120px] resize-none" 
          placeholder=" " 
          {...props}
        />
      ) : type === 'select' ? (
        <div className="relative">
          <select 
            className="peer w-full appearance-none bg-black/20 text-gray-100 border-2 border-white/5 rounded-2xl px-5 py-4 pt-6 focus:bg-black/40 focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] outline-none transition-all duration-300"
            {...props}
          >
            {props.options.map(opt => <option key={opt} value={opt} className="bg-gray-900 text-gray-100">{opt}</option>)}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 peer-focus:text-indigo-400 transition-colors">
            <ChevronRight size={20} className="rotate-90"/>
          </div>
        </div>
      ) : (
        <input 
          type={type} 
          className="peer w-full bg-black/20 text-gray-100 border-2 border-white/5 rounded-2xl px-5 py-4 pt-6 focus:bg-black/40 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] outline-none transition-all duration-300 placeholder-transparent" 
          placeholder=" " 
          {...props}
        />
      )}
      
      {/* Floating Label Animation */}
      <label className="absolute left-5 top-1 text-xs font-bold text-gray-500 uppercase tracking-widest transition-all duration-300 
        peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:tracking-normal
        peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-indigo-400 peer-focus:tracking-widest pointer-events-none">
        {label}
      </label>
    </div>
  </div>
);

export default Input;