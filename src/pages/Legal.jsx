import React, { useState } from 'react';
import { ArrowLeft, FileText, Shield, Lock, AlertTriangle, Users, FileCheck, DollarSign } from 'lucide-react';

const Legal = ({ onBack }) => {
  const [activeDoc, setActiveDoc] = useState('terms');

  const documents = {
    terms: {
      title: "Terms & Conditions",
      icon: <FileText size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p><strong>Introduction:</strong> Welcome to TeenVerseHub ("Platform", "we", "our"). By accessing or using our services, you agree to these Terms & Conditions. If you do not agree, please do not use our platform.</p>
          
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">Nature of Service</h3>
          <p>TeenVerseHub is an online platform that connects teenage freelancers with clients. We are only a facilitator. We do not employ users, guarantee work, or control the outcomes of any service.</p>
          
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">Eligibility</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Users must be 14–19 years old.</li>
            <li>Users under 18 require parent/guardian consent.</li>
            <li>Parent/guardian identity may be verified approved alternatives in place of their child.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">User Responsibilities</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Provide accurate information.</li>
            <li>Not offer illegal, harmful, or age‑restricted services.</li>
            <li>Maintain respectful communication.</li>
            <li>Follow all community guidelines.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">Platform Fee & Payments</h3>
          <p>TeenVerseHub charges a <strong>2% platform fee</strong> on every completed transaction. This fee is non‑refundable. Teenage freelancers may receive payments into a parent/guardian bank account if they are under 18.</p>

          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">Prohibited Activities</h3>
          <p>Users may NOT offer hacking, scams, dangerous tasks, adult content, violence, fake documents, exam assistance, or illegal services.</p>
        </div>
      )
    },
    privacy: {
      title: "Privacy Policy",
      icon: <Lock size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Information We Collect</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Name, Age, Email, Country</li>
            <li>Parent/guardian verification data (with consent)</li>
            <li>Usage data (analytics)</li>
          </ul>
          <p><strong>We DO NOT collect:</strong> Aadhaar number directly, Financial documents, School details, or Unnecessary personal data.</p>

          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">How We Use Data</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Account creation & age verification</li>
            <li>Connecting freelancers and clients</li>
            <li>Communication & notifications</li>
            <li>Platform safety & fraud prevention</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">Data Sharing & Protection</h3>
          <p>We never sell user data. We only share minimal information with verification partners (with consent) and Payment processors. We use encryption, secure storage, and restricted access to protect user data.</p>
        </div>
      )
    },
    refund: {
      title: "Refund Policy",
      icon: <DollarSign size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Platform Fee Refunds</h3>
          <p>The 2% platform fee is <strong>non‑refundable</strong>. This applies even if the project is cancelled by the client or freelancer.</p>

          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">Client–Freelancer Payments</h3>
          <p>Payments between clients and freelancers are not handled by the platform. Therefore:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Refunds must be discussed directly between the client and freelancer.</li>
            <li>The platform is not liable for disputes.</li>
          </ul>
        </div>
      )
    },
    community: {
      title: "Community Guidelines",
      icon: <Users size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Allowed Content</h3>
          <p>Creative services (editing, design, writing, music), Educational help (not exam cheating), Technical services, Skills-based freelancing.</p>

          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">Strictly Prohibited</h3>
          <ul className="list-disc ml-5 space-y-1 text-red-600 dark:text-red-400 font-medium">
            <li>Hacking / cracking</li>
            <li>Academic cheating</li>
            <li>Adult content / Violence / Hate speech</li>
            <li>Harassment or bullying</li>
            <li>Scams or payment fraud</li>
          </ul>
        </div>
      )
    },
    disclaimer: {
      title: "Disclaimer",
      icon: <AlertTriangle size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>TeenVerseHub is <strong>not an employer</strong> of any teen. We only provide an online space for users to interact.</p>
          <p>We do not supervise work, verify skills, or guarantee results. Users must ensure legality and safety of their work. We are not responsible for third‑party actions or damages.</p>
        </div>
      )
    },
    parental: {
      title: "Parental Consent Form",
      icon: <FileCheck size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-center font-bold text-xl mb-4">Parental Consent for TeenVerseHub Account</h3>
          <p>I, ______________________ (Parent/Guardian Name), hereby give permission for my child:</p>
          <p>Child Name: ______________________ Age: ______</p>
          <p>To create an account and use the TeenVerseHub platform.</p>
          
          <h4 className="font-bold mt-4">I understand and agree that:</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li>My child may interact with clients online.</li>
            <li>My child may earn money through freelancing.</li>
            <li>Payments may be processed through my account.</li>
            <li>TeenVerseHub is only a facilitator and not responsible for disputes.</li>
          </ul>
          
          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700 flex justify-between">
             <span>Parent Signature: ______________________</span>
             <span>Date: ______________</span>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row font-sans transition-colors duration-300">
      
      {/* ================= SIDEBAR / TOPBAR ================= */}
      {/* Mobile: Sticky Top Bar | Desktop: Sticky Left Sidebar */}
      <div className="w-full md:w-72 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 md:h-screen sticky top-0 z-30">
        
        {/* Header (Back Button) */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors font-medium text-sm md:text-base">
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Back to Home</span><span className="sm:hidden">Back</span>
          </button>
          {/* Mobile Only: Page Title */}
          <span className="md:hidden font-bold text-gray-900 dark:text-white text-sm">Legal Center</span>
        </div>

        {/* Navigation List */}
        {/* Mobile: Horizontal Scroll | Desktop: Vertical List */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto md:flex-1 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1 scrollbar-hide bg-gray-50/50 md:bg-transparent dark:bg-gray-900/50">
          {/* Desktop Label */}
          <h2 className="hidden md:block px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Legal Documents</h2>
          
          {Object.keys(documents).map((key) => (
            <button
              key={key}
              onClick={() => setActiveDoc(key)}
              className={`
                flex-shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-xl text-sm font-medium transition-all whitespace-nowrap
                ${activeDoc === key 
                  ? 'bg-indigo-600 text-white md:bg-indigo-50 md:text-indigo-700 dark:md:bg-indigo-900/30 dark:md:text-indigo-300 shadow-md md:shadow-none' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white md:bg-transparent border md:border-none border-gray-200 dark:border-gray-700'}
              `}
            >
              <span className="block">{documents[key].icon}</span>
              {documents[key].title}
            </button>
          ))}
        </div>

        {/* Footer (Desktop Only) */}
        <div className="hidden md:block p-6 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold">
                <Shield size={14} /> Legally Compliant
            </div>
            <p className="text-xs text-gray-400 mt-1">Last updated: November 2025</p>
        </div>
      </div>

      {/* ================= CONTENT AREA ================= */}
      <div className="flex-1 p-4 sm:p-6 md:p-12 overflow-y-auto h-auto md:h-screen">
         <div className="max-w-3xl mx-auto pb-20 md:pb-0">
            {/* Content Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 md:mb-8">
               <div className="w-12 h-12 md:w-auto md:h-auto p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {documents[activeDoc].icon}
               </div>
               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{documents[activeDoc].title}</h1>
            </div>
            
            {/* Document Body */}
            <div className="bg-white dark:bg-gray-900 p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 leading-relaxed text-base md:text-lg">
               {documents[activeDoc].content}
            </div>

            {/* Mobile Only Footer */}
            <div className="md:hidden mt-8 text-center">
              <p className="text-xs text-gray-400">Last updated: November 2025 • Secure & Compliant</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Legal;