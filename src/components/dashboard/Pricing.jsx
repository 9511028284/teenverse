import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Crown, Zap, Star, Shield, Rocket, Sparkles, Building2, 
  Lock, ArrowRight, HelpCircle, ChevronDown
} from 'lucide-react';
import Button from '../ui/Button'; // Adjust path if needed

const Pricing = ({ isClient, user, onSubscribe }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const currentUserPlan = user?.current_plan || 'Basic';

  // --- FREELANCER PLANS ---
  const freelancerPlans = [
    {
      name: 'Basic',
      planId: 'basic',
      priceAmount: 0,
      price: 'Free',
      monthlyPrice: 'Free',
      duration: 'Forever',
      icon: <Shield className="text-gray-400" size={24} />,
      badge: null,
      commission: '5%',
      features: [
        { text: '5 bids / month', included: true },
        { text: '1 resume / month', included: true },
        { text: 'Normal chat support', included: true },
        { text: 'Early feature access', included: false },
        { text: 'Exclusive profile badge', included: false },
        { text: 'Higher profile visibility', included: false },
      ],
      cta: 'Current Plan',
      style: 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-xl',
      btnStyle: 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-white/5'
    },
    {
      name: 'Starter',
      planId: 'starter',
      priceAmount: 99,
      price: '₹99',
      monthlyPrice: '₹99',
      duration: 'for 2 Years',
      icon: <Rocket className="text-blue-500" size={24} />,
      badge: 'First 100 Users 🚀',
      commission: '4%',
      features: [
        { text: '12 bids / month', included: true },
        { text: '2 resumes / month', included: true },
        { text: 'Founder chat support', included: true },
        { text: 'Early feature access', included: true },
        { text: 'Starter badge on profile', included: true },
        { text: 'Higher profile visibility', included: false },
      ],
      cta: 'Grab Starter',
      style: 'border-blue-200 dark:border-blue-900/50 bg-gradient-to-b from-white to-blue-50/80 dark:from-[#0F172A] dark:to-blue-900/20 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20',
      btnStyle: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
    },
    {
      name: 'Pro',
      planId: 'pro',
      priceAmount: isAnnual ? 299 : 29,
      price: '₹299',
      monthlyPrice: '₹29',
      duration: isAnnual ? '/ year' : '/ month',
      icon: <Star className="text-indigo-500" size={24} />,
      badge: 'Most Popular ⭐',
      commission: '3.5%',
      features: [
        { text: '18 bids / month', included: true },
        { text: '6 resumes / month', included: true },
        { text: 'Direct team support', included: true },
        { text: 'Early feature access', included: true },
        { text: 'Pro badge & Visibility', included: true },
        { text: 'Founder community access', included: true },
      ],
      cta: 'Go Pro',
      style: 'border-indigo-500 ring-4 ring-indigo-500/20 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/30 dark:to-[#0F172A] shadow-2xl shadow-indigo-500/30 scale-105 z-10 relative overflow-hidden',
      btnStyle: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/40'
    },
    {
      name: 'Elite',
      planId: 'elite',
      priceAmount: isAnnual ? 599 : 59,
      price: '₹599',
      monthlyPrice: '₹59',
      duration: isAnnual ? '/ year' : '/ month',
      icon: <Crown className="text-amber-500" size={24} />,
      badge: 'Royal Tier 👑',
      commission: '3%',
      features: [
        { text: 'Unlimited bids', included: true },
        { text: 'Unlimited resumes', included: true },
        { text: 'Priority VIP Support', included: true },
        { text: 'Elite Badge & Top Visibility', included: true },
        { text: 'Profile appears on TOP', included: true },
        { text: 'Access to Elite Jobs', included: true },
      ],
      cta: 'Become Elite',
      style: 'border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-white to-amber-50/80 dark:from-[#0F172A] dark:to-amber-900/20 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20',
      btnStyle: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30'
    }
  ];

  const faqs = [
    { q: "Can I cancel my subscription anytime?", a: "Yes! You can cancel anytime from your settings. You'll keep your premium features until the end of your billing cycle." },
    { q: "How do the commission rates work?", a: "When you complete a job, we take a small cut to keep the platform running. Free users pay 5%, but Elite users only pay 3%—which saves you a ton of money as you scale!" },
    { q: "What does 'Higher visibility' mean?", a: "The algorithm pushes Pro and Elite profiles to the top of client search results and job application lists, meaning you get hired faster." }
  ];

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  // ==========================================
  // CLIENT VIEW (Professional & Trustworthy)
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
      {/* Animated Background Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] -z-10 animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] -z-10 animate-[pulse_8s_ease-in-out_infinite_reverse]"></div>

      {/* HEADER SECTION */}
      <div className="text-center mb-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-800 dark:text-indigo-200 text-sm font-bold mb-6 border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
        >
          <Sparkles size={16} className="text-amber-500" /> Invest in Your Hustle
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Full Potential</span>
        </h2>
        <p className="text-slate-500 dark:text-gray-400 max-w-xl mx-auto text-lg mb-8">
          Get exclusive badges, rank higher in search, and keep more of your hard-earned money with lower commission rates. 
        </p>

        {/* BILLING TOGGLE */}
        <div className="flex items-center justify-center gap-4">
           <span className={`text-sm font-bold ${!isAnnual ? 'text-indigo-600 dark:text-white' : 'text-slate-400'}`}>Monthly</span>
           <button 
             onClick={() => setIsAnnual(!isAnnual)}
             className="w-14 h-7 bg-slate-200 dark:bg-gray-700 rounded-full relative p-1 transition-colors hover:bg-slate-300 dark:hover:bg-gray-600 focus:outline-none"
           >
              <motion.div 
                 layout
                 className="w-5 h-5 bg-indigo-600 rounded-full shadow-md"
                 animate={{ x: isAnnual ? 28 : 0 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
           </button>
           <span className={`text-sm font-bold flex items-center gap-2 ${isAnnual ? 'text-indigo-600 dark:text-white' : 'text-slate-400'}`}>
             Annually <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
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
        {freelancerPlans.map((plan, index) => {
          const isCurrentPlan = currentUserPlan === plan.name;
          
          return (
            <motion.div 
              key={plan.name} 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-6 border ${plan.style} transition-all duration-300 flex flex-col ${plan.name === 'Pro' ? 'md:h-[105%]' : 'h-full'}`}
            >
              {/* GLOW EFFECT FOR PRO */}
              {plan.name === 'Pro' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              )}

              {/* BADGE */}
              {plan.badge && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-max px-3 py-1 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg ${plan.name === 'Pro' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-800 dark:bg-white dark:text-black'}`}>
                  {plan.badge}
                </div>
              )}

              {/* CARD HEADER */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              </div>

              {/* PRICE */}
              <div className="mb-6 pb-6 border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {isAnnual ? plan.price : plan.monthlyPrice}
                  </span>
                  <span className="text-sm font-bold text-gray-400">{plan.duration}</span>
                </div>
                <div className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1.5">
                  <Zap size={12} fill="currentColor" /> Only {plan.commission} Comm. Rate
                </div>
              </div>

              {/* FEATURES LIST */}
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    {feature.included ? (
                      <div className="mt-0.5 p-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                         <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <X size={16} className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-slate-700 dark:text-gray-200 font-semibold' : 'text-gray-400 dark:text-gray-600 font-medium'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CALL TO ACTION */}
              <Button 
                onClick={() => !isCurrentPlan && plan.planId !== 'basic' && onSubscribe(plan, isAnnual)}
                disabled={isCurrentPlan || plan.planId === 'basic'}
                className={`w-full py-4 rounded-xl font-black tracking-wide uppercase text-sm flex items-center justify-center gap-2 group ${isCurrentPlan ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-white/5 border border-gray-200 dark:border-white/10' : plan.btnStyle}`}
              >
                {isCurrentPlan ? 'Current Plan' : plan.cta} 
                {!isCurrentPlan && plan.name !== 'Basic' && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
              </Button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* FAQ SECTION (Lightweight & Sleek) */}
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
                <span className={`font-semibold transition-colors duration-300 ${openFaq === i ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-gray-200 group-hover:text-indigo-500 dark:group-hover:text-indigo-300'}`}>
                  {faq.q}
                </span>
                <div className={`ml-4 p-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/10'}`}>
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

    </div>
  );
};

export default Pricing;