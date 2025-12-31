import React from 'react';
import { ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock } from 'lucide-react';

const BadgeItem = ({ name, iconName }) => {
  const IconMap = { ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock };
  const Icon = IconMap[iconName] || Award;

  const colors = {
    trust: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    fun: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    skill: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    work: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    safety: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  };

  let cat = 'fun';
  if (['Verified Teen', 'Parent Approved', 'KYC Completed'].includes(name)) cat = 'trust';
  if (['First Gig', 'Rising Talent'].includes(name)) cat = 'work';
  if (['Skill Certified', 'Academy Graduate'].includes(name)) cat = 'skill';
  if (['Safe User', 'Community Safe'].includes(name)) cat = 'safety';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${colors[cat]}`}>
      <Icon size={12} />
      {name}
    </div>
  );
};

export default BadgeItem;