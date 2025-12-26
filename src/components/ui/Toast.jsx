import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const isError = type === 'error';
  
  return (
    <div className="fixed top-6 right-6 z-[120] animate-in slide-in-from-right-10 duration-500">
      <div className={`relative overflow-hidden pl-5 pr-12 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl flex items-center gap-4 group 
        ${isError ? 'bg-[#1a0505]/90' : 'bg-[#051a10]/90'}`}>
        
        {/* Glowing Status Orb */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isError ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]'}`} />

        <div className={`p-2 rounded-full ${isError ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
        </div>

        <div className="flex flex-col">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isError ? 'text-red-400' : 'text-emerald-400'}`}>
            {isError ? 'System Error' : 'Success'}
          </span>
          <span className="text-sm font-medium text-gray-200">{message}</span>
        </div>

        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={14}/>
        </button>

        {/* Scanline texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none opacity-50" style={{backgroundSize: '100% 3px'}} />
      </div>
    </div>
  );
};

export default Toast;