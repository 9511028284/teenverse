import React from 'react';
import { Check, X } from 'lucide-react'; // Ensure you have lucide-react installed or use standard emojis

const PricingPage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full font-sans">
      {/* Header */}
      <div className="text-center mb-12 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Upgrade your TeenVerse</h1>
        <p className="text-gray-500 mt-3 text-lg">Choose the plan that fits your freelance journey.</p>
      </div>

      {/* Pricing Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        
        {/* 1. FREE PLAN */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-500">Starter</h3>
          <div className="my-4 flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">₹0</span>
            <span className="text-gray-500 ml-2">/month</span>
          </div>
          <p className="text-gray-500 text-sm mb-6">Perfect for just starting out.</p>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-sm text-gray-700">
              <Check size={20} className="text-green-500 flex-shrink-0"/> Basic Portfolio
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <Check size={20} className="text-green-500 flex-shrink-0"/> 5 Job Applications/mo
            </li>
            <li className="flex gap-3 text-sm text-gray-400">
              <X size={20} className="text-gray-300 flex-shrink-0"/> AI Portfolio Builder
            </li>
            <li className="flex gap-3 text-sm text-gray-400">
              <X size={20} className="text-gray-300 flex-shrink-0"/> Battle Arena Access
            </li>
          </ul>
          <button className="w-full py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Current Plan
          </button>
        </div>

        {/* 2. PRO PLAN (Highlighted) */}
        <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl transform md:-translate-y-4 border border-gray-800 relative flex flex-col">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
            MOST POPULAR
          </div>
          <h3 className="text-xl font-semibold text-gray-300">Pro Freelancer</h3>
          <div className="my-4 flex items-baseline">
            <span className="text-4xl font-bold text-white">₹499</span>
            <span className="text-gray-400 ml-2">/month</span>
          </div>
          <p className="text-gray-400 text-sm mb-6">For those serious about earning.</p>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-sm text-gray-200">
              <Check size={20} className="text-blue-400 flex-shrink-0"/> AI Portfolio Builder
            </li>
            <li className="flex gap-3 text-sm text-gray-200">
              <Check size={20} className="text-blue-400 flex-shrink-0"/> Unlimited Applications
            </li>
            <li className="flex gap-3 text-sm text-gray-200">
              <Check size={20} className="text-blue-400 flex-shrink-0"/> Access to Battle Arena ⚔️
            </li>
            <li className="flex gap-3 text-sm text-gray-200">
              <Check size={20} className="text-blue-400 flex-shrink-0"/> Priority Support
            </li>
          </ul>
          <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
            Upgrade Now
          </button>
        </div>

        {/* 3. AGENCY PLAN */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-500">Agency</h3>
          <div className="my-4 flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">₹2,499</span>
            <span className="text-gray-500 ml-2">/month</span>
          </div>
          <p className="text-gray-500 text-sm mb-6">For scaling and team management.</p>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-sm text-gray-700">
              <Check size={20} className="text-green-500 flex-shrink-0"/> Everything in Pro
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <Check size={20} className="text-green-500 flex-shrink-0"/> Team Management
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <Check size={20} className="text-green-500 flex-shrink-0"/> Custom Branding
            </li>
          </ul>
          <button className="w-full py-3 border border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors">
            Contact Sales
          </button>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;