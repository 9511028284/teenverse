import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Crown, Zap, Gem, Shield, Sparkles, Building2, 
  Lock, ArrowRight, ChevronDown, Wallet
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal'; 

const Pricing = ({ isClient, user, onSubscribe }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  // 🚀 Checkout Modal States
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [useWallet, setUseWallet] = useState(true);

  const currentUserPlan = user?.current_plan || 'Basic';
  const walletBalance = Number(user?.wallet_balance) || 0;

  // 🛡️ FRONTEND SUBSCRIPTION LOCK LOGIC
  const planExpiryDate = user?.plan_expires_at ? new Date(user.plan_expires_at) : null;
  const isPlanActive = currentUserPlan !== 'Basic' && planExpiryDate && planExpiryDate > new Date();

  // --- PREMIUM FREELANCER PLANS ---
  const freelancerPlans = [
    {
      name: 'Basic',
      planId: 'basic',
      priceAmount: 0,
      price: 'Free',
      monthlyPrice: 'Free',
      duration: 'Forever',
      icon: <Shield className="text-slate-400" size={26} strokeWidth={1.5} />,
      badge: null,
      commission: '10%',
      features: [
        { text: '5 bids / month', included: true },
        { text: '1 resume / month', included: true },
        { text: 'Standard support', included: true },
        { text: 'Early feature access', included: false },
        { text: 'Exclusive profile badge', included: false },
        { text: 'Higher profile visibility', included: false },
      ],
      cta: 'Current Plan',
      style: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0F172A]/50 backdrop-blur-xl',
      btnStyle: 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-white/5',
      textColor: 'text-slate-900 dark:text-white',
      mutedText: 'text-slate-500 dark:text-slate-400'
    },
    {
      name: 'Starter',
      planId: 'starter',
      priceAmount: 149,
      price: '₹149',
      monthlyPrice: '₹149',
      duration: 'for 1 Years',
      icon: <Zap className="text-cyan-500" size={26} strokeWidth={2} />,
      badge: '100 users only ⚡',
      commission: '7%',
      features: [
        { text: '12 bids / month', included: true },
        { text: '2 resumes / month', included: true },
        { text: 'Founder chat support', included: true },
        { text: 'Early feature access', included: true },
        { text: 'Starter badge on profile', included: true },
        { text: 'Higher profile visibility', included: false },
      ],
      cta: 'Grab Starter',
      style: 'border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-br from-white to-cyan-50/80 dark:from-[#0F172A] dark:to-cyan-900/20 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/20',
      btnStyle: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md shadow-cyan-500/20',
      textColor: 'text-slate-900 dark:text-white',
      mutedText: 'text-slate-500 dark:text-slate-400'
    },
    {
      name: 'Pro',
      planId: 'pro',
      priceAmount: isAnnual ? 199 : 999,
      price: '₹999',
      monthlyPrice: '₹199',
      duration: isAnnual ? '/ year' : '/ month',
      annualDiscount: '14%', 
      icon: <Gem className="text-fuchsia-500" size={28} strokeWidth={2} />,
      badge: 'Premium 💎',
      commission: '6%',
      features: [
        { text: '18 bids / month', included: true },
        { text: '6 resumes / month', included: true },
        { text: 'Direct team support', included: true },
        { text: 'Early feature access', included: true },
        { text: 'Pro badge & Visibility', included: true },
        { text: 'Founder community access', included: true },
      ],
      cta: 'Go Pro',
      style: 'border-fuchsia-500 ring-4 ring-fuchsia-500/20 bg-gradient-to-b from-fuchsia-50 to-white dark:from-fuchsia-900/30 dark:to-[#0F172A] shadow-2xl shadow-fuchsia-500/30 scale-105 z-10 relative overflow-hidden',
      btnStyle: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white shadow-xl shadow-fuchsia-500/40',
      textColor: 'text-slate-900 dark:text-white',
      mutedText: 'text-slate-500 dark:text-slate-400'
    },
    {
      name: 'Elite',
      planId: 'elite',
      priceAmount: isAnnual ? 399 : 3999,
      price: '₹3999',
      monthlyPrice: '₹399',
      duration: isAnnual ? '/ year' : '/ month',
      annualDiscount: '15%', 
      icon: <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" size={30} strokeWidth={2} />,
      badge: 'VIP Black 👑',
      commission: '4%',
      features: [
        { text: 'Unlimited bids', included: true },
        { text: 'Unlimited resumes', included: true },
        { text: 'Priority VIP Support', included: true },
        { text: 'Elite Badge & Top Visibility', included: true },
        { text: 'Profile appears on TOP', included: true },
        { text: 'Access to Elite Jobs', included: true },
      ],
      cta: 'Claim VIP Status',
      style: 'border-amber-500/50 ring-1 ring-amber-500/30 bg-gradient-to-br from-slate-900 via-black to-slate-900 shadow-2xl shadow-amber-900/50 hover:shadow-amber-600/40 transition-all',
      btnStyle: 'bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-black font-black shadow-lg shadow-amber-500/30',
      textColor: 'text-white',
      mutedText: 'text-amber-100/70'
    }
  ];

  const faqs = [
    { q: "Can I cancel my subscription anytime?", a: "Yes! You can cancel anytime from your settings. You'll keep your premium features until the end of your billing cycle." },
    { q: "How do the commission rates work?", a: "When you complete a job, we take a small cut to keep the platform running. Free users pay 10%, but Elite users only pay 4%—which saves you a ton of money as you scale!" },
    { q: "What does 'Higher visibility' mean?", a: "The algorithm pushes Pro and Elite profiles to the top of client search results and job application lists, meaning you get hired faster." }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  // ==========================================
  // CLIENT VIEW
  // ==========================================
  if (isClient) {
    return (
      <div className="max-w-5xl mx-auto py-8 relative">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">No subscriptions. No hidden fees. Only pay a small platform fee when you successfully hire and release escrow.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
               <Building2 size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Posting is Always Free</h3>
            <p className="text-slate-500 dark:text-gray-400 mb-6">Create unlimited job listings and review proposals from top Gen-Z talent without spending a dime upfront.</p>
            <ul className="space-y-4">
               {['Unlimited Job Posts & Edits', 'Review Unlimited Portfolios', 'Free Chat & Interviewing'].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-gray-300">
                    <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full"><Check size={14} className="text-emerald-600 dark:text-emerald-400" /></div> {item}
                 </li>
               ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl -ml-10 -mb-10"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 text-indigo-50">Platform Fee</h3>
              <div className="flex items-baseline gap-2 mb-4">
                 <span className="text-6xl font-black tracking-tighter">5%</span>
                 <span className="text-indigo-200 font-medium">per transaction</span>
              </div>
              <p className="text-indigo-100 mb-8 leading-relaxed">We only make money when you successfully hire. This fee covers secure escrow, dispute resolution, and 24/7 priority support.</p>
            </div>
            <Button className="w-full relative z-10 bg-white text-indigo-700 hover:bg-slate-50 border-none font-bold py-4 text-lg shadow-xl shadow-black/10">
               Post a Job Now
            </Button>
          </motion.div>
        </div>

        {/* HOW ESCROW WORKS - Client Trust Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-4xl mx-auto bg-slate-50 dark:bg-white/5 rounded-3xl p-8 border border-slate-200 dark:border-white/5">
           <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-8 flex items-center justify-center gap-2">
             <Lock className="text-indigo-500" size={24} /> Your Money is 100% Secure
           </h3>
           <div className="grid md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0"></div>
              
              {[
                { step: "1", title: "Fund Escrow", desc: "Deposit funds securely when you hire. The freelancer starts working knowing they will be paid." },
                { step: "2", title: "Review Work", desc: "The freelancer submits the completed project. You review it and request revisions if needed." },
                { step: "3", title: "Release Funds", desc: "Only release the payment when you are 100% satisfied with the final delivery." }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                   <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30 mb-4 ring-4 ring-white dark:ring-[#1E293B]">
                     {item.step}
                   </div>
                   <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                   <p className="text-xs text-slate-500 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
           </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // FREELANCER VIEW (Gen-Z, Hype, Animated)
  // ==========================================
  return (
    <div className="py-8 relative min-h-screen">
      <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-[100px] -z-10 animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] -z-10 animate-[pulse_8s_ease-in-out_infinite_reverse]"></div>

      {/* HEADER SECTION */}
      <div className="text-center mb-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-800 dark:text-amber-200 text-sm font-bold mb-6 border border-amber-200 dark:border-amber-500/30 shadow-sm"
        >
          <Crown size={16} className="text-amber-500" /> Premium Upgrades
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-purple-600">Full Potential</span>
        </h2>
        <p className="text-slate-500 dark:text-gray-400 max-w-xl mx-auto text-lg mb-8">
          Get exclusive VIP badges, rank higher in search, and keep more of your hard-earned money with lower commission rates. 
        </p>

        {/* BILLING TOGGLE */}
        <div className="flex items-center justify-center gap-4">
           <span className={`text-sm font-bold ${!isAnnual ? 'text-fuchsia-600 dark:text-white' : 'text-slate-400'}`}>Monthly</span>
           <button 
             onClick={() => setIsAnnual(!isAnnual)}
             className="w-14 h-7 bg-slate-200 dark:bg-gray-700 rounded-full relative p-1 transition-colors hover:bg-slate-300 dark:hover:bg-gray-600 focus:outline-none"
           >
              <motion.div 
                 layout
                 className="w-5 h-5 bg-fuchsia-600 rounded-full shadow-md"
                 animate={{ x: isAnnual ? 28 : 0 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
           </button>
           <span className={`text-sm font-bold flex items-center gap-2 ${isAnnual ? 'text-fuchsia-600 dark:text-white' : 'text-slate-400'}`}>
             Annually
           </span>
        </div>
      </div>

      {/* PRICING CARDS */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 items-end z-10 relative"
      >
        {freelancerPlans.map((plan) => {
          
          // 🚀 DETERMINE LOCK STATES FOR EACH CARD
          const isThisPlanCurrent = currentUserPlan === plan.name;
          const isDisabled = isPlanActive || plan.planId === 'basic';
          
          let buttonText = plan.cta;
          if (plan.planId === 'basic') {
              buttonText = 'Current Plan';
          } else if (isPlanActive) {
              if (isThisPlanCurrent) {
                  buttonText = `Current (Expires ${planExpiryDate?.toLocaleDateString()})`;
              } else {
                  buttonText = 'Locked (Active Plan)';
              }
          }
          
          return (
            <motion.div 
              key={plan.name} 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-6 border ${plan.style} transition-all duration-300 flex flex-col ${plan.name === 'Pro' ? 'md:h-[105%]' : 'h-full'}`}
            >
              {/* GLOW EFFECT FOR PRO & ELITE */}
              {plan.name === 'Pro' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500"></div>
              )}
              {plan.name === 'Elite' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
              )}

              {/* BADGE */}
              {plan.badge && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-max px-4 py-1 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg ${
                  plan.name === 'Pro' ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600' : 
                  plan.name === 'Elite' ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black' : 
                  'bg-slate-800 dark:bg-white dark:text-black'
                }`}>
                  {plan.badge}
                </div>
              )}

              {/* CARD HEADER */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl shadow-sm border ${plan.name === 'Elite' ? 'bg-black/50 border-white/10' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                  {plan.icon}
                </div>
                <h3 className={`text-xl font-bold ${plan.textColor}`}>{plan.name}</h3>
              </div>

              {/* PRICE */}
              <div className={`mb-6 pb-6 border-b ${plan.name === 'Elite' ? 'border-white/10' : 'border-gray-200/60 dark:border-gray-800/60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${plan.textColor}`}>
                      {isAnnual ? plan.price : plan.monthlyPrice}
                    </span>
                    <span className={`text-sm font-bold ${plan.mutedText}`}>{plan.duration}</span>
                  </div>
                  {isAnnual && plan.annualDiscount && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                        plan.name === 'Elite' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                    }`}>
                      Save {plan.annualDiscount}
                    </span>
                  )}
                </div>
                <div className={`mt-3 text-xs font-bold w-fit px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                    plan.name === 'Elite' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50'
                }`}>
                  <Zap size={12} fill="currentColor" /> Only {plan.commission} Comm. Rate
                </div>
              </div>

              {/* FEATURES LIST */}
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    {feature.included ? (
                      <div className={`mt-0.5 p-0.5 rounded-full ${
                          plan.name === 'Elite' ? 'bg-amber-500/20 text-amber-400' : 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400'
                      }`}>
                         <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <X size={16} className={`shrink-0 mt-0.5 ${plan.name === 'Elite' ? 'text-white/20' : 'text-gray-300 dark:text-gray-600'}`} />
                    )}
                    <span className={feature.included ? `${plan.textColor} font-semibold` : `${plan.mutedText} font-medium`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* 🚀 SMART CALL TO ACTION */}
              <Button 
                onClick={() => {
                  if (!isDisabled) {
                    setCheckoutPlan({ plan, isAnnual });
                    setUseWallet(walletBalance > 0);
                  }
                }}
                disabled={isDisabled}
                className={`w-full py-4 rounded-xl font-black tracking-wide uppercase text-[11px] flex items-center justify-center gap-2 group ${
                    isDisabled 
                    ? (plan.name === 'Elite' ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10' : 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-white/5 border border-gray-200 dark:border-white/10') 
                    : plan.btnStyle
                }`}
              >
                {buttonText}
                {!isDisabled && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
              </Button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* FAQ SECTION */}
      <div className="max-w-2xl mx-auto mt-24 mb-12 px-4 relative z-10">
        <h3 className="text-xl font-bold text-center text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-8 flex items-center justify-center gap-2">
           Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-200 dark:border-white/10 last:border-0 pb-2">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center py-4 text-left focus:outline-none group"
              >
                <span className={`font-semibold transition-colors duration-300 ${openFaq === i ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-800 dark:text-gray-200 group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-300'}`}>
                  {faq.q}
                </span>
                <div className={`ml-4 p-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180 bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/10'}`}>
                  <ChevronDown size={16} />
                </div>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 pr-8 text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 CUSTOM CHECKOUT MODAL */}
      {checkoutPlan && (() => {
         const { plan, isAnnual } = checkoutPlan;
         const totalCost = plan.priceAmount;
         const applicableWallet = Math.min(walletBalance, totalCost);
         const walletDeduction = useWallet ? applicableWallet : 0;
         const finalPayable = totalCost - walletDeduction;

         const handleConfirm = () => {
             onSubscribe(plan, isAnnual, walletDeduction, finalPayable);
             setCheckoutPlan(null);
         };

         return (
           <Modal title={`Upgrade to ${plan.name}`} onClose={() => setCheckoutPlan(null)}>
             <div className="space-y-5">
               <div className="bg-slate-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-slate-100 dark:border-gray-700">
                 <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Subscription Summary</h4>
                 
                 <div className="flex justify-between items-center text-sm text-slate-600 dark:text-gray-400 mb-3">
                   <span>{plan.name} Plan ({isAnnual && plan.name !== 'Starter' ? 'Annually' : plan.name === 'Starter' ? '2 Years' : 'Monthly'})</span>
                   <span className="font-bold text-slate-900 dark:text-white">₹{totalCost.toFixed(2)}</span>
                 </div>
                 
                 {/* Wallet Toggle Section */}
                 <div className="flex items-center justify-between p-3 mt-4 bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-100 dark:border-fuchsia-800/50 rounded-xl transition-all">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-800/50 rounded-lg">
                        <Wallet size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-fuchsia-900 dark:text-fuchsia-300">Wallet Balance</p>
                       <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400">Available: ₹{walletBalance.toFixed(2)}</p>
                     </div>
                   </div>
                   
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       className="sr-only peer" 
                       checked={useWallet} 
                       onChange={() => setUseWallet(!useWallet)}
                       disabled={walletBalance <= 0}
                     />
                     <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-fuchsia-600"></div>
                   </label>
                 </div>

                 {useWallet && walletDeduction > 0 && (
                   <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400 mt-4 font-bold">
                     <span>Wallet Applied</span>
                     <span>- ₹{walletDeduction.toFixed(2)}</span>
                   </div>
                 )}

                 <div className="h-px bg-slate-200 dark:bg-slate-700 my-4"></div>
                 
                 <div className="flex justify-between items-center text-base">
                   <span className="font-bold text-slate-900 dark:text-white">Amount to Pay</span>
                   <span className="font-black text-fuchsia-600 dark:text-fuchsia-400 text-2xl">
                     ₹{finalPayable.toFixed(2)}
                   </span>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                 <Button variant="ghost" type="button" onClick={() => setCheckoutPlan(null)}>Cancel</Button>
                 <Button onClick={handleConfirm} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-xl shadow-fuchsia-500/20 font-bold">
                   {finalPayable === 0 ? 'Pay entirely with Wallet' : `Proceed to Pay (₹${finalPayable})`}
                 </Button>
               </div>
             </div>
           </Modal>
         );
      })()}

    </div>
  );
};

export default Pricing;