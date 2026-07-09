import React from 'react';
import { 
  Save, User, Shield, Smartphone, Globe, Activity, CheckCircle, AlertTriangle, Clock, ChevronRight, ShieldCheck, Mail,
  LockKeyhole, Bell, CreditCard, LifeBuoy, ExternalLink, FileText, KeyRound, Sparkles
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs) { 
  return twMerge(clsx(inputs)); 
}

// --- LIQUID GLASS INPUT ---
const GlassInput = ({ label, icon: Icon, helper, className = '', disabled, readOnly, ...props }) => (
  <div className="group relative w-full space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors duration-300 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400">
        {label}
      </label>
      {readOnly && <LockKeyhole size={10} className="text-slate-300 dark:text-slate-600" />}
    </div>
    <div className={cn(
      "relative flex items-center overflow-hidden rounded-2xl border transition-all duration-300",
      disabled || readOnly 
        ? "bg-slate-50/50 border-slate-200/50 dark:bg-slate-900/20 dark:border-white/5 opacity-70" 
        : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900/40 dark:border-white/10 dark:hover:border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]",
      "group-focus-within:border-indigo-500 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 dark:group-focus-within:border-indigo-400 dark:group-focus-within:ring-indigo-500/20"
    )}>
      {Icon && (
        <div className="pl-4 text-slate-400 transition-colors duration-300 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400">
          <Icon size={16} strokeWidth={2.5} />
        </div>
      )}
      <input 
        disabled={disabled || readOnly}
        readOnly={readOnly}
        className={cn(
          "w-full bg-transparent py-3.5 px-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all",
          (disabled || readOnly) && "cursor-not-allowed",
          className
        )}
        {...props}
      />
    </div>
    {helper && <p className="text-[10px] font-bold text-slate-400">{helper}</p>}
  </div>
);

// --- BENTO BOX WRAPPER ---
const BentoCard = ({ children, className, glowColor }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ type: "spring", stiffness: 200, damping: 20 }}
    className={cn(
      "relative overflow-hidden rounded-[32px] border bg-white/70 shadow-sm backdrop-blur-2xl transition-all duration-300 dark:bg-[#0B0F19]/80 dark:border-white/[0.04]",
      className
    )}
  >
    {glowColor && (
      <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 hover:opacity-100" style={{ background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)` }} />
    )}
    <div className="relative z-10 h-full w-full p-6 sm:p-8">
      {children}
    </div>
  </motion.div>
);

// --- MAIN SETTINGS COMPONENT ---
const SettingsComp = ({ profileForm, setProfileForm, isClient, handleUpdateProfile, parentMode, setParentMode, onOpenKyc }) => {
  
  // KYC Configuration Hub
  const kycStatus = profileForm.kyc_status || 'not_started';
  const kycConfig = {
    verified: { color: "from-emerald-400 to-teal-500", text: "text-emerald-500", icon: CheckCircle, title: "Identity Verified", desc: "Your ecosystem pass is active and authenticated." },
    approved: { color: "from-emerald-400 to-teal-500", text: "text-emerald-500", icon: CheckCircle, title: "Identity Approved", desc: "Access granted to all platform frameworks." },
    pending: { color: "from-amber-400 to-orange-500", text: "text-amber-500", icon: Clock, title: "Under Review", desc: "Validating your identity parameters. Hold tight." },
    rejected: { color: "from-rose-500 to-red-500", text: "text-rose-500", icon: AlertTriangle, title: "Action Required", desc: profileForm.kyc_rejection_reason || "Verification mismatch. Please retry." },
    not_started: { color: "from-indigo-500 to-purple-500", text: "text-indigo-500", icon: ShieldCheck, title: "Verify Identity", desc: "Required to unlock platform earning mechanics." }
  };
  const statusUI = kycConfig[kycStatus] || kycConfig.not_started;
  const StatusIcon = statusUI.icon;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-24 font-sans sm:pb-10 selection:bg-indigo-500/30 selection:text-indigo-600 dark:selection:text-indigo-400">
      
      {/* --- FLOATING HEADER --- */}
      <div className="sticky top-0 z-50 -mx-4 mb-8 flex items-center justify-between border-b border-slate-200/50 bg-white/70 px-4 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#070A14]/70 sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Control <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">Center</span>
          </h1>
          <p className="mt-1 hidden text-xs font-bold uppercase tracking-wider text-slate-400 sm:block">Manage your parameters, safety, and identity.</p>
        </div>
        
        <button 
          onClick={handleUpdateProfile} 
          disabled={parentMode} 
          className="group relative hidden items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 sm:flex"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Save size={16} className="relative z-10" />
          <span className="relative z-10">Sync Data</span>
        </button>
      </div>

      {/* --- GRID SYSTEM --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

        {/* 1. IDENTITY MATRIX */}
        <BentoCard className="md:col-span-8 border-slate-200 dark:border-white/5" glowColor="rgba(99, 102, 241, 0.05)">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Identity Matrix</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Public & System Demographics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <GlassInput label="Display Designation" icon={User} value={profileForm.name || ""} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
            <GlassInput label="Comms Node (Locked)" icon={LockKeyhole} value={profileForm.phone || ""} readOnly helper="Phone linkage is permanently bound for structural security." />
            <GlassInput label="Global Region" icon={Globe} value={profileForm.nationality || ""} onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} />
            {!isClient && (
              <GlassInput label="Age Parameter" icon={Activity} type="number" value={profileForm.age || ""} readOnly disabled className="text-slate-400 dark:text-slate-500" />
            )}
          </div>
        </BentoCard>

        {/* 2. PARENTAL SHIELD (Interactive Switch) */}
        <BentoCard className={cn(
            "md:col-span-4 flex flex-col justify-between overflow-hidden border-transparent transition-colors duration-500",
            parentMode ? "bg-amber-400 dark:bg-amber-500 shadow-amber-500/20" : "bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/5"
          )}
        >
          {parentMode && <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-[80px]" />}
          
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-[20px] shadow-sm transition-colors duration-500 border", parentMode ? "bg-white/20 text-white border-white/30" : "bg-amber-100 text-amber-600 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20")}>
                <Shield size={20} strokeWidth={2.5} />
              </div>
            </div>
            <h3 className={cn("text-2xl font-black tracking-tight transition-colors duration-500", parentMode ? "text-white" : "text-slate-900 dark:text-white")}>
              Parent Shield
            </h3>
            <p className={cn("mt-1 text-xs font-bold leading-relaxed transition-colors duration-500", parentMode ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
              Hardware-level lock on sensitive configurations and financial triggers.
            </p>
          </div>

          <button 
            onClick={() => setParentMode(!parentMode)}
            className="group relative z-10 mt-8 flex h-14 w-full cursor-pointer items-center rounded-2xl bg-black/10 p-1 backdrop-blur-sm dark:bg-black/40"
          >
            <motion.div 
              layout 
              className={cn("flex h-full w-1/2 items-center justify-center rounded-xl font-black text-xs uppercase tracking-widest shadow-sm", parentMode ? "bg-white text-amber-500 ml-auto" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white")}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {parentMode ? "Engaged" : "Disabled"}
            </motion.div>
          </button>
        </BentoCard>

        {/* 3. GUARDIAN COMMS (Freelancers Only) */}
        {!isClient && (
          <BentoCard className="md:col-span-6 border-slate-200 dark:border-white/5" glowColor="rgba(236, 72, 153, 0.05)">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-pink-50 text-pink-500 shadow-sm dark:bg-pink-500/10 dark:text-pink-400 border border-pink-100 dark:border-pink-500/20">
                <Mail size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Guardian Uplink</h2>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Authorization Node</p>
              </div>
            </div>
            <div className="space-y-4">
              <GlassInput label="Parent/Guardian Email Address" icon={Mail} type="email" placeholder="guardian@network.com" value={profileForm.parent_email || ""} onChange={e => setProfileForm({...profileForm, parent_email: e.target.value})} />
              <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-500/10 dark:bg-indigo-500/5">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-relaxed dark:text-slate-400">
                  Transmits secure OTP tokens for structural account changes when Parent Shield is active.
                </p>
              </div>
            </div>
          </BentoCard>
        )}

        {/* 4. KYC PROTOCOL CARD (Freelancers Only) */}
        {!isClient && (
          <div className="md:col-span-6 p-[2px] rounded-[34px] bg-gradient-to-br shadow-sm" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} className={cn("md:col-span-6 relative rounded-[34px] p-[1.5px]", `bg-gradient-to-br ${statusUI.color}`)}>
            <div className="h-full w-full rounded-[32px] bg-white p-6 sm:p-8 dark:bg-[#0B0F19] flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-10 dark:opacity-20", `bg-gradient-to-b ${statusUI.color}`)} />
              
              <div className="relative z-10">
                <div className={cn("mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br text-white shadow-xl", statusUI.color)}>
                  <StatusIcon size={32} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{statusUI.title}</h3>
                <span className={cn("mt-2 inline-block rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border", statusUI.text, `border-${statusUI.text.split('-')[1]}-200/50 bg-${statusUI.text.split('-')[1]}-50 dark:bg-${statusUI.text.split('-')[1]}-500/10`)}>
                  State: {kycStatus.replace('_', ' ')}
                </span>
                
                <p className="mx-auto mt-4 max-w-xs text-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400">
                  {statusUI.desc}
                </p>
                
                {!['verified', 'approved', 'pending'].includes(kycStatus) && (
                  <button onClick={onOpenKyc} className="group mx-auto mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900 shadow-md">
                    Initiate Protocol <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SYSTEM CHECKS & LINKS --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Safety Core */}
        <BentoCard className="lg:col-span-2 border-slate-200 dark:border-white/5">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-emerald-50 text-emerald-500 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <KeyRound size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Security Diagnostics</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live environmental checks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SafetyItem icon={Smartphone} title="Hardware Bound" desc="Mobile anchor cannot be altered." done />
            <SafetyItem icon={ShieldCheck} title="Identity Ledger" desc={statusUI.title} done={['verified', 'approved'].includes(kycStatus)} />
            <SafetyItem icon={Shield} title="Shield Status" desc={parentMode ? 'Max security engaged.' : 'Standard operational bounds.'} done={parentMode} />
            <SafetyItem icon={CreditCard} title="Escrow Active" desc="Financial paths are encrypted." done />
          </div>
        </BentoCard>

        {/* Quick Links */}
        <BentoCard className="border-slate-200 dark:border-white/5">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-slate-100 text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-white/5">
              <Bell size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Directory</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">External parameters</p>
            </div>
          </div>

          <div className="space-y-3">
            <QuickLink href="http://teenversehub.in/legal#official-documents" icon={FileText} title="Official Documents" />
            <QuickLink href="mailto:support@teenversehub.in" icon={LifeBuoy} title="Communicate Support" />
            <QuickLink href="http://teenversehub.in/legal#privacy" icon={ExternalLink} title="Privacy Protocols" />
          </div>
        </BentoCard>
      </div>

      {/* --- MOBILE FLOATING ACTION BAR --- */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-4 right-4 z-50 sm:hidden"
        >
          <div className="overflow-hidden rounded-2xl bg-white/60 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:bg-[#0B0F19]/80 border border-white/20 dark:border-white/10">
            <button 
              onClick={handleUpdateProfile} 
              disabled={parentMode} 
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Save size={16} className="relative z-10" />
              <span className="relative z-10">Sync Configuration</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const SafetyItem = ({ icon: Icon, title, desc, done }) => (
  <div className="flex items-start gap-4 rounded-[20px] border border-slate-200/60 bg-slate-50/50 p-4 dark:border-white/[0.04] dark:bg-slate-900/30">
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm border transition-colors", done ? "bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500")}>
      <Icon size={18} strokeWidth={2.5} />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  </div>
);

const QuickLink = ({ href, icon: Icon, title }) => (
  <a
    href={href} target="_blank" rel="noopener noreferrer"
    className="group flex items-center justify-between rounded-[16px] border border-slate-200/60 bg-slate-50/50 px-4 py-3.5 transition-all hover:bg-indigo-50 hover:border-indigo-100 dark:border-white/[0.04] dark:bg-slate-900/30 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/20"
  >
    <span className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-slate-600 transition-colors group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400">
      <Icon size={16} strokeWidth={2.5} /> {title}
    </span>
    <ChevronRight size={14} strokeWidth={3} className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-indigo-400" />
  </a>
);

export default SettingsComp;