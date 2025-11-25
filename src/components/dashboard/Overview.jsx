import React from 'react';
import { Award } from 'lucide-react';
import Button from '../ui/Button';

const Overview = ({ user, isClient, totalEarnings, jobsCount, applicationsCount, badgesCount, setTab }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Hello, {user.name?.split(' ')[0]}! 👋</h1>
          <p className="text-indigo-100 opacity-90 mb-6 max-w-xl">
            {isClient ? "Track your projects and manage payments efficiently." : "Your skills are in high demand. Keep learning to earn more!"}
          </p>
          <div className="flex gap-3">
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-lg" onClick={() => setTab('jobs')}>{isClient ? 'Post Job' : 'Find Work'}</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-2">{isClient ? 'Total Spent' : 'Earnings'}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalEarnings.toFixed(2)}</h3>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-2">{isClient ? 'Active Jobs' : 'Applications'}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{isClient ? jobsCount : applicationsCount}</h3>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-2">Badges Earned</p>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"><Award size={20}/> {badgesCount}</div>
        </div>
      </div>
    </div>
  );
};

export default Overview;