'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon } from 'lucide-react';
import { useAuthLogic } from '../hooks/useAuthLogic';
import { Toast } from '../components/auth/AuthUI';
import { LoginView, SignupView, ForgotPasswordView, UpdatePasswordView } from '../components/auth/AuthForms';

export default function Auth({
  setView,
  onLogin,
  onSessionReady,
  initialMode = 'login',
  signupRole,
  lockSignupRole = false,
}) {
  const { state, actions, refs } = useAuthLogic(onLogin, onSessionReady, {
    initialMode,
    signupRole,
    lockSignupRole,
  });
  
  // Theme State Management (Defaulted to true for Dark Mode)
  const [isDark, setIsDark] = useState(true);

  // Sync theme globally to the documentElement for full class-level utility coverage
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 transition-colors duration-300 relative overflow-x-hidden dark:bg-zinc-950 dark:text-zinc-50">
      
      {/* Absolute Header Navigation Actions (Theme Toggle + Close Window) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white/80 backdrop-blur-sm text-neutral-500 hover:text-neutral-900 transition-all dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-200 shadow-sm"
          aria-label="Toggle Theme"
          type="button"
        >
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
        </button>

        <button 
          onClick={() => setView('home')} 
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white/80 backdrop-blur-sm text-neutral-500 hover:text-neutral-900 transition-all dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-200 shadow-sm group"
          aria-label="Close page link profile"
          type="button"
        >
          <X size={15} className="transition-transform duration-200 group-hover:rotate-90" />
        </button>
      </div>

      <Toast toast={state.toast} />

      {/* Dynamic Form Transition Pipelines */}
      <AnimatePresence mode="wait">
        {state.verificationSent ? (
          <motion.div 
            key="verification-success-screen"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="w-full min-h-screen flex items-center justify-center px-4 py-12"
          >
            <div className="w-full max-w-sm text-center space-y-6">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50">Check your inbox.</h2>
                <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">
                  A secure access magic token has been generated and transmitted safely to:
                </p>
                <div className="pt-1.5">
                  <span className="inline-block font-mono text-xs font-semibold text-neutral-800 dark:text-zinc-200 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg dark:bg-zinc-900 dark:border-zinc-800">
                    {state.formData.email}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => { actions.setVerificationSent(false); actions.setViewMode('login'); }} 
                className="w-full h-11 px-5 font-semibold text-[14px] rounded-xl bg-neutral-900 text-white hover:bg-black transition-colors dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-sm"
              >
                Return to Login
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={state.viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full min-h-screen"
          >
            {state.viewMode === 'login' && <LoginView state={state} actions={actions} turnstileRef={refs.turnstileRef} />}
            {state.viewMode === 'signup' && <SignupView state={state} actions={actions} turnstileRef={refs.turnstileRef} />}
            {state.viewMode === 'update_password' && <UpdatePasswordView state={state} actions={actions} />}
            {state.viewMode === 'forgot' && <ForgotPasswordView state={state} actions={actions} turnstileRef={refs.turnstileRef} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Firebase invisible Recaptcha container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
