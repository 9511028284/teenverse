import React, { forwardRef } from 'react';
import { Rocket, User, Share2, Download } from 'lucide-react';
import Button from '../ui/Button'; // Assuming this path is correct for your project

// We wrap the component in forwardRef so the parent (Dashboard) can "see" the div inside
const ProfileCard = forwardRef(({ user, unlockedSkills, badges, userLevel, applications, handleDownloadCard, showToast }, ref) => {
  return (
    <div className="flex flex-col items-center animate-fade-in">
      {/* 1. We add ref={ref} here on the MAIN CARD div.
          This tells the download function: "This is the specific box to take a picture of."
      */}
      <div 
        ref={ref} 
        className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
        <div className="relative z-10 mt-16">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-[#1E293B] p-1 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-600 dark:text-gray-300 border-4 border-white dark:border-[#1E293B]">
              {user.name ? user.name[0] : <User/>}
            </div>
          </div>
          <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
          <p className="text-indigo-500 font-medium mb-4">{user.specialty || "Freelancer"}</p>
          
          <div className="flex justify-center gap-2 mb-6">
            {badges.map((badge, i) => (
              <span key={i} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-xs px-2 py-1 rounded-full font-bold border border-yellow-200 dark:border-yellow-900/50">{badge}</span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6 border-t border-b border-gray-100 dark:border-gray-700 py-4">
            <div><div className="font-bold text-gray-900 dark:text-white">{(applications || []).filter(a => a.status === 'Paid').length}</div><div className="text-xs text-gray-500">Jobs</div></div>
            <div><div className="font-bold text-gray-900 dark:text-white">{userLevel}</div><div className="text-xs text-gray-500">Level</div></div>
            <div><div className="font-bold text-gray-900 dark:text-white">4.9</div><div className="text-xs text-gray-500">Rating</div></div>
          </div>

          <div className="flex gap-3">
            {/* The buttons stay the same, they just trigger the logic passed from props */}
            <Button className="flex-1" icon={Share2} onClick={() => showToast("Link copied to clipboard!")}>Share Link</Button>
            <Button variant="outline" className="flex-1" icon={Download} onClick={handleDownloadCard}>Save Image</Button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Display name for debugging tools
ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;