import React, { useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, Loader2, User, Briefcase, 
  Check, Globe, Gift, ArrowRight, ArrowLeft,
  Calendar as CalendarIcon, MapPin, Map, Megaphone, ChevronDown, Phone, Key, Shield,
  Rocket, Sparkles // Added Rocket & Sparkles for mobile glimpses
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", 
  "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];
const HEAR_ABOUT_OPTIONS = ['YouTube', 'Instagram', 'LinkedIn', 'Friend', 'School', 'Other'];

const viewVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.05, delayChildren: 0.05 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
};

// --- ICONS ---
const GoogleIcon = memo(() => (
  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
));

const GithubIcon = memo(() => (
  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] fill-current text-[#0f0f0f] dark:text-white transition-colors duration-500">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
));

// --- NEW: FLOATING MOBILE ICONS ---
const FloatingSVGIcon = memo(({ Icon, className, delay = 0 }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div 
      animate={prefersReducedMotion ? {} : { y: [0, -12, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
      style={{ willChange: "transform" }} 
      className={`absolute pointer-events-none z-0 text-[#0f0f0f]/[0.04] dark:text-white/[0.04] md:hidden ${className}`}
    >
      <Icon size={160} strokeWidth={1} />
    </motion.div>
  );
});

// --- SHARED UI COMPONENTS ---
const ActionButton = ({ onClick, loading, icon: Icon, children, className }) => (
  <button 
    onClick={onClick} 
    disabled={loading} 
    className={`w-full p-[14px] font-medium text-[0.9rem] rounded-[16px] transition-all duration-150 flex justify-center items-center gap-2 relative overflow-hidden active:scale-[0.98] disabled:opacity-50 tracking-[-0.01em] ${className || 'bg-[#0f0f0f] dark:bg-white text-white dark:text-[#0f0f0f] hover:bg-black/80 dark:hover:bg-gray-200'}`}
  >
     <AnimatePresence mode="wait">
       {loading ? (
         <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
           <Loader2 className="animate-spin relative z-10" size={16}/>
         </motion.div>
       ) : (
         <motion.span key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
           {children} {Icon && <Icon size={15}/>}
         </motion.span>
       )}
     </AnimatePresence>
  </button>
);

const SocialBtn = ({ onClick, icon, label }) => (
  <button onClick={onClick} className="flex-1 p-[12px] bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-[16px] cursor-pointer flex items-center justify-center gap-2 text-[0.82rem] font-medium text-[#0f0f0f] dark:text-white transition-all duration-300 hover:bg-[#edece8] dark:hover:bg-[#222] hover:border-black/15 dark:hover:border-white/20 active:scale-95">
    {icon} {label}
  </button>
);

const StepBar = ({ step, total = 4 }) => (
  <div className="flex gap-[6px] mb-8 relative z-10">
    {Array.from({ length: total }).map((_, i) => (
      <div 
        key={i} 
        className={`h-[3px] rounded-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          i + 1 < step ? 'bg-[#0f0f0f] dark:bg-white flex-1' : 
          i + 1 === step ? 'bg-[#0f0f0f] dark:bg-white flex-[2]' : 
          'bg-[#edece8] dark:bg-[#222] flex-1'
        }`} 
      />
    ))}
  </div>
);

// --- CUSTOM INTERACTIVE CALENDAR ---
const CustomCalendar = ({ selectedDateStr, onDateSelect, showToast }) => {
  const minAge = 14;
  const maxAge = 21;
  const today = new Date();
  const minYear = today.getFullYear() - maxAge;
  const maxYear = today.getFullYear() - minAge;

  const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null;

  const [calYear, setCalYear] = useState(selectedDate ? selectedDate.getFullYear() : maxYear);
  const [calMonth, setCalMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());
  const [yearView, setYearView] = useState(false);

  const handleCalNav = (dir) => {
    if (yearView) return;
    let newMonth = calMonth + dir;
    let newYear = calYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newYear < minYear) newYear = minYear;
    if (newYear > maxYear) newYear = maxYear;
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  const handleSelectDay = (d) => {
    const date = new Date(calYear, calMonth, d);
    const todayD = new Date();
    let calcAge = todayD.getFullYear() - date.getFullYear();
    const m = todayD.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && todayD.getDate() < date.getDate())) calcAge--;

    if (calcAge < minAge || calcAge > maxAge) {
      showToast(`Platform is for ages ${minAge}–${maxAge} only.`, 'error');
      return;
    }
    
    // Convert to strict YYYY-MM-DD avoiding timezone shifts
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0];
    
    onDateSelect(dateStr, calcAge);
  };

  const renderBody = () => {
    if (yearView) {
      const years = [];
      for (let y = maxYear; y >= minYear; y--) {
        years.push(
          <button
            key={y}
            type="button"
            onClick={() => { setCalYear(y); setYearView(false); }}
            className={`py-2 px-1.5 rounded-lg cursor-pointer font-sans text-[0.8rem] transition-colors text-center ${y === calYear ? 'bg-[#0f0f0f] dark:bg-white text-white dark:text-[#0f0f0f] font-semibold' : 'text-[#4a4a4a] dark:text-[#a1a1aa] hover:bg-[#edece8] dark:hover:bg-[#222] hover:text-[#0f0f0f] dark:hover:text-white'}`}
          >
            {y}
          </button>
        );
      }
      return <div className="grid grid-cols-3 gap-1.5">{years}</div>;
    }

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());

    const emptyCells = Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />);

    const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = i + 1;
      const date = new Date(calYear, calMonth, d);
      const isToday = date.toDateString() === today.toDateString();
      const outRange = date < minDate || date > maxDate;
      const isSel = selectedDate && date.toDateString() === selectedDate.toDateString();

      let cls = "aspect-square flex items-center justify-center rounded-lg text-[0.8rem] transition-colors border select-none ";
      if (outRange) {
        cls += "opacity-25 cursor-not-allowed border-transparent text-[#4a4a4a] dark:text-[#a1a1aa]";
      } else if (isSel) {
        cls += "bg-[#0f0f0f] dark:bg-white border-transparent text-white dark:text-[#0f0f0f] font-semibold cursor-pointer";
      } else {
        cls += "border-transparent text-[#4a4a4a] dark:text-[#a1a1aa] cursor-pointer hover:bg-[#edece8] dark:hover:bg-[#222] hover:text-[#0f0f0f] dark:hover:text-white";
        if (isToday) cls = cls.replace("border-transparent", "border-[#9a9a9a] dark:border-[#666] font-semibold text-[#0f0f0f] dark:text-white");
      }

      return (
        <div key={d} className={cls} onClick={!outRange ? () => handleSelectDay(d) : undefined}>
          {d}
        </div>
      );
    });

    return (
      <>
        <div className="grid grid-cols-7 mb-1 relative z-10">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <span key={d} className="text-center text-[0.65rem] font-semibold tracking-[0.06em] text-[#9a9a9a] dark:text-[#666] py-0.5 uppercase">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 relative z-10">
          {emptyCells}
          {dayCells}
        </div>
      </>
    );
  };

  return (
    <div className="bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-[16px] p-4 transition-colors duration-300 relative z-10">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => handleCalNav(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9a9a9a] dark:text-[#666] hover:bg-[#edece8] dark:hover:bg-[#222] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span onClick={() => setYearView(!yearView)} className="text-[0.85rem] font-semibold text-[#0f0f0f] dark:text-white tracking-[-0.01em] cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          {yearView ? 'Select Year' : `${['January','February','March','April','May','June','July','August','September','October','November','December'][calMonth]} ${calYear}`}
        </span>
        <button type="button" onClick={() => handleCalNav(1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9a9a9a] dark:text-[#666] hover:bg-[#edece8] dark:hover:bg-[#222] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      {renderBody()}
    </div>
  );
};


// --- LOGIN VIEW ---
export const LoginView = memo(({ state, actions, refs }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <motion.div key="login" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
      <FloatingSVGIcon Icon={Rocket} className="-top-12 -right-8" delay={0.2} />
      
      <motion.div variants={itemVariants} className="relative z-10">
         <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem] transition-colors duration-500">Welcome back.</h2>
         <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5] transition-colors duration-500">Sign in to your TeenVerseHub account.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-[0.75rem] mb-[1.25rem] relative z-10">
         <SocialBtn icon={<GoogleIcon />} onClick={() => actions.handleSocialLogin('google')} label="Google" />
         <SocialBtn icon={<GithubIcon />} onClick={() => actions.handleSocialLogin('github')} label="GitHub" />
      </motion.div>
       
      <motion.div variants={itemVariants} className="flex items-center gap-3 my-5 text-[#9a9a9a] dark:text-[#a1a1aa] text-[0.78rem] before:flex-1 before:h-px before:bg-black/10 dark:before:bg-white/10 after:flex-1 after:h-px after:bg-black/10 dark:after:bg-white/10 transition-colors duration-500 relative z-10">
         or continue with email
      </motion.div>

      <div className="space-y-4 relative z-10">
        <motion.div variants={itemVariants} className="mb-4">
           <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem] transition-colors duration-500">Email</label>
           <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
              <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors duration-300">
                <Mail size={15} strokeWidth={1.8}/>
              </span>
              <input type="email" placeholder="you@example.com" className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666] transition-colors duration-500" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} />
           </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-4">
           <div className="flex justify-between items-center mb-[0.4rem]">
              <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase m-0 transition-colors duration-500">Password</label>
              <button onClick={() => actions.setViewMode('forgot')} className="bg-none border-none cursor-pointer font-sans text-[0.75rem] text-[#9a9a9a] dark:text-[#a1a1aa] underline underline-offset-2 hover:text-[#0f0f0f] dark:hover:text-white transition-colors duration-300 p-0">Forgot?</button>
           </div>
           <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
              <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors duration-300">
                <Lock size={15} strokeWidth={1.8}/>
              </span>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666] transition-colors duration-500" value={state.formData.password} onChange={(e) => actions.updateField('password', e.target.value)} />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-[12px] bg-none border-none cursor-pointer text-[#9a9a9a] dark:text-[#666] flex p-1 hover:text-[#0f0f0f] dark:hover:text-white transition-colors duration-300">
                {showPassword ? <EyeOff size={14} strokeWidth={1.8}/> : <Eye size={14} strokeWidth={1.8}/>}
              </button>
           </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mt-3 relative z-10">
          {state.CLOUDFLARE_SITE_KEY && (
              <div className="flex justify-center py-2 bg-[#f5f4f1] dark:bg-[#1a1a1a] rounded-[16px] border border-black/10 dark:border-white/10 mb-4 min-h-[65px] items-center transition-colors duration-500">
                  <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="light" />
              </div>
          )}
          <ActionButton onClick={actions.handleFinalSubmit} loading={state.loading}>
             Continue
             {!state.loading && <ArrowRight size={15} strokeWidth={2}/>}
          </ActionButton>
      </motion.div>
       
      <motion.div variants={itemVariants} className="text-center text-[0.82rem] text-[#9a9a9a] dark:text-[#a1a1aa] mt-5 transition-colors duration-500 relative z-10">
         New to TeenVerseHub? <button onClick={() => actions.setViewMode('signup')} className="bg-none border-none cursor-pointer font-sans text-[0.82rem] text-[#0f0f0f] dark:text-white font-medium underline underline-offset-3 hover:text-black/70 dark:hover:text-gray-300 transition-colors">Create account</button>
      </motion.div>
    </motion.div>
  );
});

// --- SIGNUP VIEW ---
export const SignupView = memo(({ state, actions, refs }) => {
  const { step, formData, isPhoneVerified, otpLoading, socialUser, agreedToTerms } = state;
  const calculatedAge = formData.age || state.age || (formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : null);
  
  return (
    <motion.div key="signup" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col relative w-full">
        
        <button onClick={step > 1 ? actions.handleBack : () => actions.setViewMode('login')} className="inline-flex items-center gap-[6px] bg-none border-none cursor-pointer font-sans text-[0.82rem] text-[#9a9a9a] dark:text-[#a1a1aa] mb-7 hover:text-[#0f0f0f] dark:hover:text-white transition-colors p-0 w-fit relative z-10">
            <ArrowLeft size={14} strokeWidth={2}/> Back
        </button>

        {step > 1 && <StepBar step={step} />}

        <AnimatePresence mode="wait">
            {/* STEP 1: ROLE */}
            {step === 1 && (
                <motion.div key="step1" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
                    <FloatingSVGIcon Icon={Sparkles} className="-top-10 -right-6" delay={0.1} />
                    <motion.div variants={itemVariants} className="relative z-10">
                        <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem] transition-colors duration-500">Join TeenVerseHub.</h2>
                        <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5] transition-colors duration-500">Who are you? Choose your path — you can always evolve.</p>
                    </motion.div>
                    
                    <div className="flex flex-col gap-[0.75rem] mb-7 relative z-10">
                        {['freelancer', 'client'].map((r) => (
                            <motion.button 
                                variants={itemVariants} key={r} onClick={() => actions.updateField('role', r)} 
                                className={`p-[1.1rem_1.25rem] border-[1.5px] rounded-[16px] cursor-pointer transition-all duration-300 flex items-start gap-[14px] relative overflow-hidden text-left
                                ${formData.role === r ? 'bg-white dark:bg-[#1a1a1a] border-[#0f0f0f] dark:border-white shadow-[0_0_0_4px_rgba(15,15,15,0.05)] dark:shadow-[0_0_0_4px_rgba(255,255,255,0.1)]' : 'bg-[#f5f4f1] dark:bg-[#111] border-transparent dark:border-white/5 hover:bg-white dark:hover:bg-[#1a1a1a] hover:border-black/10 dark:hover:border-white/20'}`}
                            >
                                <div className={`w-[42px] h-[42px] shrink-0 rounded-xl flex items-center justify-center text-[1.2rem] transition-transform duration-300 ${formData.role === r ? 'scale-105' : ''} ${r === 'freelancer' ? 'bg-[#e8f5ff] dark:bg-blue-500/20' : 'bg-[#fff4e8] dark:bg-orange-500/20'}`}>
                                    {r === 'freelancer' ? '🚀' : '🏢'}
                                </div>
                                <div>
                                    <div className="text-[0.95rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.2] mb-[3px] transition-colors">{r === 'freelancer' ? "I'm a Creator / Freelancer" : "I'm a Client / Hirer"}</div>
                                    <div className="text-[0.78rem] text-[#9a9a9a] dark:text-[#888] leading-[1.45] transition-colors">{r === 'freelancer' ? 'Build your profile, showcase skills, and land real opportunities. Your work, your rules.' : 'Find exceptional young talent. Post projects, collaborate, and build something real.'}</div>
                                </div>
                                <div className={`absolute right-[14px] top-[14px] w-[20px] h-[20px] rounded-full bg-[#0f0f0f] dark:bg-white flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${formData.role === r ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                    <Check size={10} strokeWidth={3} className="text-white dark:text-black"/>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <motion.div variants={itemVariants} className="relative z-10">
                      <ActionButton onClick={actions.handleNext} disabled={!formData.role} loading={state.loading}>
                          Continue <ArrowRight size={15} strokeWidth={2}/>
                      </ActionButton>
                    </motion.div>
                </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && !socialUser && (
                <motion.div key="step2" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
                    <FloatingSVGIcon Icon={Key} className="-top-10 -right-6" delay={0.3} />
                    <motion.div variants={itemVariants} className="relative z-10">
                        <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem] transition-colors">Your identity.</h2>
                        <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5] transition-colors">Create your account credentials.</p>
                    </motion.div>
                    
                    <div className="space-y-4 mb-2 relative z-10">
                        <motion.div variants={itemVariants}>
                            <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem] transition-colors">Email</label>
                            <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
                                <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors"><Mail size={15} strokeWidth={1.8}/></span>
                                <input type="email" value={formData.email} onChange={(e) => actions.updateField('email', e.target.value)} className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666] transition-colors" placeholder="you@example.com"/>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem] transition-colors">Password</label>
                            <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
                                <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors"><Lock size={15} strokeWidth={1.8}/></span>
                                <input type="password" value={formData.password} onChange={(e) => actions.updateField('password', e.target.value)} className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666] transition-colors" placeholder="Min. 8 characters"/>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div variants={itemVariants} className="mt-4 relative z-10">
                        <ActionButton onClick={actions.handleNext} loading={state.loading}>
                            Continue <ArrowRight size={15} strokeWidth={2}/>
                        </ActionButton>
                    </motion.div>
                </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <motion.div key="step3" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4 relative">
                    <FloatingSVGIcon Icon={User} className="-top-10 -right-6" delay={0.5} />
                    <motion.div variants={itemVariants} className="relative z-10">
                        <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem]">Your profile.</h2>
                        <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5]">
                            {formData.role === 'client' ? 'Tell us about your organization.' : 'Tell us a little about yourself.'}
                        </p>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="relative z-10">
                        <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">Full Name</label>
                        <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
                            <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors"><User size={15} strokeWidth={1.8}/></span>
                            <input value={formData.name || ''} onChange={(e) => actions.updateField('name', e.target.value)} className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666]" placeholder="Your full name"/>
                        </div>
                    </motion.div>

                    {formData.role === 'freelancer' ? (
                        <motion.div variants={itemVariants} className="space-y-4 relative z-10">
                            <div>
                                <div className="flex items-center justify-between mb-[0.4rem]">
                                    <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-0">Date of Birth</label>
                                    <span className={`inline-flex items-center gap-1 p-[4px_10px] rounded-lg text-[0.75rem] font-medium font-mono border transition-all duration-300 ${calculatedAge ? 'bg-[#e8faf2] dark:bg-[#1a7a4a]/20 text-[#1a7a4a] dark:text-[#4ade80] border-[#88d4b0] dark:border-[#4ade80]/30' : 'bg-[#f5f4f1] dark:bg-[#1a1a1a] text-[#4a4a4a] dark:text-[#a1a1aa] border-black/10 dark:border-white/10'}`}>
                                        {calculatedAge ? `${calculatedAge} yrs` : 'Age 14–21'}
                                    </span>
                                </div>
                                
                                <CustomCalendar 
                                    selectedDateStr={formData.dob} 
                                    onDateSelect={(dateStr, calcAge) => {
                                        actions.updateField('dob', dateStr);
                                        actions.updateField('age', calcAge); 
                                    }} 
                                    showToast={actions.showToast} 
                                />

                                <div className={`font-mono text-[0.85rem] bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-[10px] p-[10px_14px] flex items-center gap-[8px] transition-colors duration-300 ${!formData.dob ? 'text-[#9a9a9a] dark:text-[#666]' : 'text-[#0f0f0f] dark:text-white'} mt-2`}>
                                    {!formData.dob ? (
                                        <>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                            No date selected
                                        </>
                                    ) : (
                                        <>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>
                                            {new Date(formData.dob).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">Gender</label>
                                <div className="flex gap-[6px]">
                                    {['Male', 'Female', 'Other'].map((g) => (
                                        <button key={g} onClick={() => actions.updateField('gender', g)} className={`flex-1 p-[11px] border-[1.5px] rounded-xl cursor-pointer font-sans text-[0.82rem] font-medium transition-all duration-300 text-center ${formData.gender === g ? 'bg-white dark:bg-[#222] border-[#0f0f0f] dark:border-white text-[#0f0f0f] dark:text-white' : 'bg-[#f5f4f1] dark:bg-[#1a1a1a] border-transparent dark:border-white/5 text-[#9a9a9a] dark:text-[#888]'}`}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div variants={itemVariants} className="relative z-10">
                            <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">Organization Name</label>
                            <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
                                <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors"><Briefcase size={15} strokeWidth={1.8}/></span>
                                <input placeholder="Company or org name (optional)" value={formData.org || ''} onChange={(e) => actions.updateField('org', e.target.value)} className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666]" />
                            </div>
                        </motion.div>
                    )}
                     
                    <motion.div variants={itemVariants} className="flex gap-2 items-end mb-4 relative z-10">
                        <div className="flex-1">
                            <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">Phone</label>
                            <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
                                <span className="absolute left-[12px] text-[0.78rem] font-mono text-[#9a9a9a] dark:text-[#666] font-medium">+91</span>
                                <input 
                                    type="tel" value={formData.phone || ''} 
                                    onChange={(e) => { if(isPhoneVerified) actions.setIsPhoneVerified(false); actions.updateField('phone', e.target.value.replace(/\D/g, '')); }} 
                                    disabled={isPhoneVerified}
                                    className="w-full p-[13px_14px_13px_48px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666]" 
                                    placeholder="10-digit number"
                                    maxLength="10"
                                />
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={actions.handlePhoneVerification} 
                            disabled={otpLoading || isPhoneVerified} 
                            className={`p-[13px_16px] whitespace-nowrap border rounded-[16px] cursor-pointer font-sans text-[0.8rem] font-medium transition-all duration-300 flex items-center justify-center gap-[6px] h-[45.2px]
                            ${isPhoneVerified ? 'bg-[#e8faf2] dark:bg-[#1a7a4a]/20 border-[#88d4b0] dark:border-[#4ade80]/30 text-[#1a7a4a] dark:text-[#4ade80]' : 'bg-[#f5f4f1] dark:bg-[#1a1a1a] border-black/10 dark:border-white/10 text-[#0f0f0f] dark:text-white hover:bg-[#edece8] dark:hover:bg-[#222]'}`}
                        >
                            {otpLoading ? <Loader2 className="animate-spin" size={15}/> : 
                             isPhoneVerified ? <><Check size={13} strokeWidth={2.5}/> Verified</> : 
                             'Verify'}
                        </button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-2 relative z-10">
                        <ActionButton onClick={actions.handleNext} loading={state.loading}>
                            Continue <ArrowRight size={15} strokeWidth={2}/>
                        </ActionButton>
                    </motion.div>
                </motion.div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
                <motion.div key="step4" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5 relative">
                    <FloatingSVGIcon Icon={Shield} className="-top-10 -right-6" delay={0.2} />
                    <motion.div variants={itemVariants} className="relative z-10">
                        <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem]">Last step.</h2>
                        <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5]">Almost there — a couple final details.</p>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="relative z-10">
                        <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">How did you find us?</label>
                        <div className="flex flex-wrap gap-[6px]">
                            {HEAR_ABOUT_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => actions.updateField('source', opt)} className={`p-[7px_14px] border-[1.5px] rounded-[50px] cursor-pointer font-sans text-[0.8rem] font-medium transition-all duration-300 ${formData.source === opt ? 'bg-[#0f0f0f] dark:bg-white text-white dark:text-[#0f0f0f] border-[#0f0f0f] dark:border-white' : 'bg-[#f5f4f1] dark:bg-[#1a1a1a] text-[#9a9a9a] dark:text-[#888] border-transparent hover:bg-white dark:hover:bg-[#222] hover:border-black/15 dark:hover:border-white/20'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-2 relative z-10">
                        <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">Referral Code <span className="font-normal normal-case tracking-normal">(optional)</span></label>
                        <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
                            <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors"><Gift size={15} strokeWidth={1.8}/></span>
                            <input value={formData.referralCode || ''} onChange={(e) => actions.updateField('referralCode', e.target.value.toUpperCase())} className="w-full p-[13px_14px_13px_42px] font-mono text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666]" placeholder="e.g. PRIYA4291"/>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-start gap-[10px] pt-2 mb-2 relative z-10">
                        <div className={`w-[20px] h-[20px] shrink-0 border-[1.5px] rounded-[6px] cursor-pointer flex items-center justify-center transition-all duration-300 mt-px ${agreedToTerms ? 'bg-[#0f0f0f] dark:bg-white border-[#0f0f0f] dark:border-white' : 'bg-[#f5f4f1] dark:bg-[#1a1a1a] border-black/10 dark:border-white/20'}`} onClick={() => actions.setAgreedToTerms(!agreedToTerms)}>
                            {agreedToTerms && <Check size={12} strokeWidth={3} className="text-white dark:text-[#0f0f0f]"/>}
                        </div>
                        <div className="text-[0.78rem] text-[#9a9a9a] dark:text-[#888] leading-[1.5]">
                            I agree to the <a href="#" className="text-[#0f0f0f] dark:text-white underline underline-offset-2">Terms of Service</a> and <a href="#" className="text-[#0f0f0f] dark:text-white underline underline-offset-2">Privacy Policy</a>. I confirm I am between 14–21 years of age.
                        </div>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="relative z-10">
                        {state.CLOUDFLARE_SITE_KEY && (
                            <div className="flex justify-center py-2 bg-[#f5f4f1] dark:bg-[#1a1a1a] rounded-[16px] border border-black/10 dark:border-white/10 mb-4 min-h-[65px] items-center">
                                <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="light" />
                            </div>
                        )}
                        <ActionButton onClick={actions.handleFinalSubmit} loading={state.loading} disabled={!agreedToTerms}>
                            Create Account <ArrowRight size={15} strokeWidth={2}/>
                        </ActionButton>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );
});

// --- FORGOT PASSWORD VIEW ---
export const ForgotPasswordView = memo(({ state, actions, refs }) => {
  return (
    <motion.div key="forgot-pw" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
      <button onClick={() => actions.setViewMode('login')} className="inline-flex items-center gap-[6px] bg-none border-none cursor-pointer font-sans text-[0.82rem] text-[#9a9a9a] dark:text-[#a1a1aa] mb-7 hover:text-[#0f0f0f] dark:hover:text-white transition-colors p-0 w-fit relative z-10">
          <ArrowLeft size={14} strokeWidth={2}/> Back to login
      </button>
       
      <AnimatePresence mode="wait">
        {!state.showResetVerify ? (
            <motion.div key="email-step" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4 relative">
                <FloatingSVGIcon Icon={Mail} className="-top-10 -right-6" delay={0.2} />
                <motion.div variants={itemVariants} className="relative z-10">
                  <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem]">Reset access.</h2>
                  <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5]">Enter your email to receive a one-time code.</p>
                </motion.div>
                
                <form onSubmit={actions.handleForgotPassword} className="space-y-4 relative z-10">
                  <motion.div variants={itemVariants}>
                      <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">Email</label>
                      <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
                          <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors"><Mail size={15} strokeWidth={1.8}/></span>
                          <input type="email" placeholder="you@example.com" className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666]" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} required />
                      </div>
                  </motion.div>
                   
                  <motion.div variants={itemVariants} className="pt-1">
                      {state.CLOUDFLARE_SITE_KEY && (
                          <div className="flex justify-center py-2 bg-[#f5f4f1] dark:bg-[#1a1a1a] rounded-[16px] border border-black/10 dark:border-white/10 mb-4 min-h-[65px] items-center">
                              <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="light" />
                          </div>
                      )}
                      <ActionButton loading={state.loading}>
                          Send Code {!state.loading && <ArrowRight size={15} strokeWidth={2}/>}
                      </ActionButton>
                  </motion.div>
                </form>
            </motion.div>
        ) : (
            <motion.div key="otp-step" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4 relative">
                <FloatingSVGIcon Icon={Key} className="-top-10 -right-6" delay={0} />
                <motion.div variants={itemVariants} className="relative z-10">
                  <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem]">Verify code.</h2>
                  <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5]">Enter the 6-digit code we sent to your inbox.</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="relative z-10">
                    <input className="w-full p-[16px] font-mono text-[1.6rem] tracking-[0.5em] text-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] text-[#0f0f0f] dark:text-white outline-none transition-all focus:bg-white dark:focus:bg-[#0f0f0f] focus:border-[#0f0f0f] dark:focus:border-white/30 focus:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]" placeholder="000000" maxLength={6} value={state.resetOtp} onChange={(e) => actions.setResetOtp(e.target.value)} />
                </motion.div>
                
                <motion.div variants={itemVariants} className="pt-2 relative z-10">
                    <ActionButton onClick={actions.handleVerifyResetOTP} loading={state.loading}>
                        Verify {!state.loading && <ArrowRight size={15} strokeWidth={2}/>}
                    </ActionButton>
                </motion.div>
                
                <motion.div variants={itemVariants} className="text-center text-[0.82rem] text-[#9a9a9a] dark:text-[#888] mt-4 relative z-10">
                    Didn't get it? <button onClick={() => actions.showToast('Code resent!','success')} className="bg-none border-none cursor-pointer font-sans text-[0.82rem] text-[#0f0f0f] dark:text-white font-medium underline underline-offset-3">Resend</button>
                    <br/><br/>
                    <button onClick={() => actions.setShowResetVerify(false)} className="bg-none border-none cursor-pointer font-sans text-[0.82rem] text-[#9a9a9a] dark:text-[#888] underline underline-offset-3 hover:text-[#0f0f0f] dark:hover:text-white">Wrong email? Change it</button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// --- UPDATE PASSWORD VIEW ---
export const UpdatePasswordView = memo(({ state, actions }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <motion.div key="update-pw" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
       <button onClick={() => actions.setViewMode('login')} className="inline-flex items-center gap-[6px] bg-none border-none cursor-pointer font-sans text-[0.82rem] text-[#9a9a9a] dark:text-[#a1a1aa] mb-7 hover:text-[#0f0f0f] dark:hover:text-white transition-colors p-0 w-fit relative z-10">
          <ArrowLeft size={14} strokeWidth={2}/> Cancel
       </button>
       
       <FloatingSVGIcon Icon={Lock} className="-top-10 -right-6" delay={0.4} />

       <motion.div variants={itemVariants} className="relative z-10">
         <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem]">New password.</h2>
         <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5]">Set your new secure password.</p>
       </motion.div>
       
       <form onSubmit={actions.handleUpdatePassword} className="space-y-4 relative z-10">
         <motion.div variants={itemVariants}>
           <label className="block text-[0.72rem] font-medium text-[#9a9a9a] dark:text-[#a1a1aa] tracking-[0.08em] uppercase mb-[0.4rem]">New Password</label>
           <div className="relative flex items-center bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 rounded-[16px] transition-all duration-300 overflow-hidden focus-within:bg-white dark:focus-within:bg-[#0f0f0f] focus-within:border-[#0f0f0f] dark:focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(15,15,15,0.06)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] group">
             <span className="absolute left-[14px] text-[#9a9a9a] dark:text-[#666] flex pointer-events-none group-focus-within:text-[#0f0f0f] dark:group-focus-within:text-white transition-colors"><Lock size={15} strokeWidth={1.8}/></span>
             <input type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" className="w-full p-[13px_14px_13px_42px] font-sans text-[0.9rem] text-[#0f0f0f] dark:text-white bg-transparent border-none outline-none leading-none placeholder:text-[#9a9a9a] dark:placeholder:text-[#666]" value={state.newPassword} onChange={(e) => actions.setNewPassword(e.target.value)} required minLength={6}/>
             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[12px] bg-none border-none cursor-pointer text-[#9a9a9a] dark:text-[#666] flex p-1 hover:text-[#0f0f0f] dark:hover:text-white transition-colors duration-300">
                {showPassword ? <EyeOff size={14} strokeWidth={1.8}/> : <Eye size={14} strokeWidth={1.8}/>}
              </button>
           </div>
         </motion.div>
         
         <motion.div variants={itemVariants} className="pt-2">
             <ActionButton loading={state.loading}>
                Update Password {!state.loading && <ArrowRight size={15} strokeWidth={2}/>}
             </ActionButton>
         </motion.div>
       </form>
    </motion.div>
  );
});