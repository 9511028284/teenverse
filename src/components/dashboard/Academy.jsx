import React, { useState } from 'react';
import { Trophy, CheckCircle, Lock, Zap, Timer } from 'lucide-react'; // Added Timer icon
import Button from '../ui/Button';
import { CATEGORIES } from '../../utils/constants'; 

const Academy = ({ unlockedSkills, setModal, quizzes }) => {
  // --- MOCK SKILL TESTS DATA ---
  const SKILL_TESTS = [
    { id: 'python_basic', title: 'Python Basics', time: '10m', questions: 10, reward: 'Python Verified Badge' },
    { id: 'canva_design', title: 'Canva Design', time: '15m', questions: 15, reward: 'Design Pro Badge' },
    { id: 'video_editing', title: 'Video Editing Fundamentals', time: '12m', questions: 12, reward: 'Editor Badge' },
  ];

  const handleStartTest = (testId) => {
      alert(`Starting ${testId} test... (This would open a timed quiz interface in a real app)`);
      // Here you would set a modal state to open the specific test component
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ... (Existing Header and Quizzes section) ... */}
       <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Trophy size={32} className="text-yellow-300"/> Level {Math.floor(unlockedSkills.length / 2) + 1} Freelancer</h2>
            <p className="text-indigo-100">Complete quizzes to unlock new job categories and earn badges!</p>
          </div>
        </div>
        <div className="mt-6 h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="h-full bg-yellow-400 transition-all duration-1000 ease-out" style={{ width: `${(unlockedSkills.length / 4) * 100}%` }}></div>
        </div>
      </div>

      {/* CATEGORY UNLOCK QUIZZES */}
      <h3 className="text-xl font-bold dark:text-white mb-4">Unlock Categories</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(quizzes).map(([key, quiz]) => {
          const isUnlocked = unlockedSkills.includes(key);
          return (
            <div key={key} className={`bg-white dark:bg-[#1E293B] p-6 rounded-2xl border ${isUnlocked ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-gray-200 dark:border-gray-700'} shadow-sm relative overflow-hidden`}>
              {isUnlocked && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-bl-xl font-bold">UNLOCKED</div>}
              <h3 className="text-xl font-bold dark:text-white mb-2 flex items-center gap-2">
                {isUnlocked ? <CheckCircle size={20} className="text-emerald-500"/> : <Lock size={20} className="text-gray-400"/>}
                {quiz.title || quiz.question} 
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pass this quiz to apply for {key.toUpperCase()} jobs.</p>
              {!isUnlocked ? (
                <Button onClick={() => setModal(`quiz-${key}`)} className="w-full">Start Quiz</Button>
              ) : (
                <Button variant="outline" disabled className="w-full border-emerald-200 text-emerald-600 dark:border-emerald-900 dark:text-emerald-500">Completed</Button>
              )}
            </div>
          );
        })}
      </div>

      {/* NEW: SKILL TESTS SECTION */}
      <div className="mt-10">
        <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><Zap className="text-yellow-500"/> Skill Verification Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SKILL_TESTS.map(test => (
                <div key={test.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-400 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Timer size={24}/>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">{test.time}</span>
                    </div>
                    <h4 className="font-bold text-lg dark:text-white mb-1">{test.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{test.questions} Questions</p>
                    <div className="text-xs font-medium text-indigo-500 mb-4">Reward: {test.reward}</div>
                    <Button variant="outline" className="w-full" onClick={() => handleStartTest(test.id)}>Take Test</Button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Academy;