import React, { useState } from 'react';
import { Shield, FileText, Check } from 'lucide-react';
import Button from '../components/ui/Button';

const TermsAgreement = ({ onAgree }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white dark:bg-gray-800 max-w-2xl w-full rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shield size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white">Review Our Terms</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Please read and accept our policies to continue to TeenVerse.</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><FileText size={16}/> 1. Introduction</h3>
            <p>Welcome to TeenVerseHub ("Platform"). By accessing our services, you agree to these terms. We connect teenage freelancers with clients but do not employ them.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><FileText size={16}/> 2. Eligibility & Safety</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Users must be 14–19 years old.</li>
              <li>Users under 18 require parent/guardian consent.</li>
              <li>Zero tolerance for harassment, scams, or unsafe behavior.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><FileText size={16}/> 3. Payments & Fees</h3>
            <p>TeenVerseHub charges a <strong>3% platform fee</strong> on completed transactions. Payments for minors may need to be processed through a parent's account.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><FileText size={16}/> 4. Privacy & Data</h3>
            <p>We collect minimal data (Name, Age, Email) for verification. We do not sell data to third parties. Parents maintain the right to audit their child's activity.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><FileText size={16}/> 5. Child Labor Compliance</h3>
            <p>Strict adherence to labor laws. No hazardous work. Work hours must not interfere with schooling.</p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <label className="flex items-start gap-3 cursor-pointer mb-6 group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 bg-white dark:bg-gray-800'}`}>
              {isChecked && <Check size={12} className="text-white" />}
            </div>
            <input type="checkbox" className="hidden" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
            <span className="text-sm text-gray-600 dark:text-gray-400 select-none group-hover:text-gray-900 dark:group-hover:text-gray-200">
              I have read and agree to the Terms of Service, Privacy Policy, and Community Guidelines. I confirm I have parental consent if under 18.
            </span>
          </label>

          <Button 
            className="w-full py-4 text-lg shadow-xl" 
            disabled={!isChecked} 
            onClick={onAgree}
          >
            Accept & Continue
          </Button>
        </div>

      </div>
    </div>
  );
};

export default TermsAgreement;