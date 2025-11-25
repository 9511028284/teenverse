import React from 'react';
import { Swords, Clock, Heart } from 'lucide-react';
import Button from '../ui/Button';

const Battles = ({ activeBattles, handleJoinBattle, handleVote }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Swords size={32}/> Weekly Battles</h2>
          <p className="text-orange-100">Compete with other teens, win XP, badges, and community clout!</p>
        </div>
      </div>
      <div className="grid gap-6">
        {activeBattles.map(battle => (
          <div key={battle.id} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase">Live</span>
                  <span className="text-gray-500 text-xs">{battle.timeLeft} Left</span>
                </div>
                <h3 className="text-xl font-bold dark:text-white">{battle.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{battle.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-indigo-600">{battle.reward}</div>
                <Button size="sm" className="mt-2" onClick={() => handleJoinBattle(battle.id)}>Join</Button>
              </div>
            </div>
            {battle.entries && battle.entries.length > 0 && (
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-bold dark:text-white mb-4">Current Entries</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {battle.entries.map(entry => (
                    <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        <img src={entry.image} alt="Entry" className="w-full h-full object-cover"/>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold dark:text-white truncate">{entry.user}</span>
                        <button onClick={() => handleVote(battle.id, entry.id)} className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-2 py-1 rounded-full transition-colors">
                          <Heart size={12} className="fill-rose-500"/> {entry.votes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Battles;