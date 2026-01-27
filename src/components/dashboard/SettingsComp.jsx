import React from 'react';
import { 
  Save, User, Shield, Smartphone, Globe, Activity, CheckCircle, AlertTriangle, Clock, ChevronRight, ShieldCheck
} from 'lucide-react'; 
import Button from '../ui/Button';

// Reusable "Gen Z" Input Field
const ModernInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-500 transition-colors">
      {label}
    </label>
    <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
      {Icon && (
        <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon size={16} />
        </div>
      )}
      <input 
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm group-hover:border-gray-300 dark:group-hover:border-white/20`}
      />
    </div>
  </div>
);

const SettingsComp = ({ profileForm, setProfileForm, isClient, handleUpdateProfile, parentMode, setParentMode, onOpenKyc }) => {
  
  // KYC Status Helper
  const kycStatus = profileForm.kyc_status || 'not_started';
  
  const kycConfig = {
    approved: {
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle,
      title: "Identity Verified",
      desc: "Your account is fully approved."
    },
    pending: {
      color: "bg-amber-500",
      lightColor: "bg-amber-50 dark:bg-amber-900/20",
      textColor: "text-amber-700 dark:text-amber-400",
      icon: Clock,
      title: "Under Review",
      desc: "We are checking your documents."
    },
    rejected: {
      color: "bg-red-500",
      lightColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-700 dark:text-red-400",
      icon: AlertTriangle,
      title: "Action Required",
      desc: profileForm.kyc_rejection_reason || "Verification failed."
    },
    not_started: {
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50 dark:bg-indigo-900/20",
      textColor: "text-indigo-700 dark:text-indigo-400",
      icon: ShieldCheck,
      title: "Verify Identity",
      desc: "Required to unlock all features."
    }
  };

  const statusUI = kycConfig[kycStatus] || kycConfig.not_started;
  const StatusIcon = statusUI.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-2">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your personal data and security.</p>
        </div>
        
        <Button 
          onClick={handleUpdateProfile} 
          disabled={parentMode} 
          className="hidden md:flex bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-indigo-500/20"
          icon={Save}
        >
          Save Changes
        </Button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* 1. IDENTITY CARD */}
        <div className="col-span-12 md:col-span-8 bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold dark:text-white">Profile Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ModernInput 
              label="Display Name" 
              icon={User}
              value={profileForm.name || ""} 
              onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
            />
            <ModernInput 
              label="Phone" 
              icon={Smartphone}
              value={profileForm.phone || ""} 
              onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
            />
            <ModernInput 
              label="Region / Nationality" 
              icon={Globe}
              value={profileForm.nationality || ""} 
              onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} 
            />
             {!isClient && (
  <ModernInput 
    label="Age" 
    icon={Activity}
    type="number"
    value={profileForm.age || ""} 
    readOnly // Prevents typing
    disabled // Grays out the field and prevents focus
    className="opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800" // Visual feedback
  />
)}
          </div>
        </div>

        {/* 2. PARENT MODE */}
        <div className={`col-span-12 md:col-span-4 p-6 rounded-[2rem] border transition-all relative overflow-hidden flex flex-col justify-between ${parentMode 
            ? 'bg-amber-500 border-amber-500 text-white shadow-lg' 
            : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${parentMode ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                  <Shield size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${parentMode ? 'bg-white text-amber-600' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                  {parentMode ? 'ON' : 'OFF'}
                </div>
              </div>
              <h3 className={`text-2xl font-black mb-1 ${parentMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Parent Shield</h3>
              <p className={`text-xs font-medium ${parentMode ? 'text-amber-100' : 'text-gray-500 dark:text-gray-400'}`}>
                Restricts sensitive actions.
              </p>
            </div>

            <button 
              onClick={() => setParentMode(!parentMode)}
              className={`w-full py-3 mt-4 rounded-xl font-bold text-sm transition-transform active:scale-95 ${
                parentMode 
                  ? 'bg-white text-amber-600 shadow-xl' 
                  : 'bg-gray-900 dark:bg-white text-white dark:text-black'
              }`}
            >
              {parentMode ? "DEACTIVATE" : "ACTIVATE"}
            </button>
        </div>

        {/* 3. KYC SECTION */}
        <div className="col-span-12">
            <div className={`${statusUI.lightColor} border border-transparent dark:border-white/5 p-1 rounded-[2rem]`}>
                <div className="bg-white/50 dark:bg-[#1E293B]/80 backdrop-blur-xl rounded-[1.8rem] p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-lg ${statusUI.color} text-white`}>
                        <StatusIcon size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                            <h3 className={`text-xl font-bold ${statusUI.textColor}`}>{statusUI.title}</h3>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-white/50 dark:bg-black/20 ${statusUI.textColor} border-current opacity-70`}>
                                {kycStatus.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {statusUI.desc}
                        </p>
                    </div>
                    {kycStatus !== 'approved' && kycStatus !== 'pending' && (
                        <button onClick={onOpenKyc} className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                            Start Verification <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComp;