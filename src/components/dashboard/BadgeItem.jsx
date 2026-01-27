import React from 'react';
import { ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock } from 'lucide-react';

const BadgeItem = ({ name, iconName }) => {
  const IconMap = { ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock };
  const Icon = IconMap[iconName] || Award;

  // Cyber-Luxe Colors
  const colors = {
    trust: "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]",
    fun: "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
    skill: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
    work: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    safety: "bg-gray-800 text-gray-300 border-gray-600 shadow-none"
  };

  let cat = 'fun';
  if (['Verified Teen', 'Parent Approved', 'KYC Completed', 'Verified'].includes(name)) cat = 'trust';
  if (['First Gig', 'Rising Talent'].includes(name)) cat = 'work';
  if (['Skill Certified', 'Academy Graduate'].includes(name)) cat = 'skill';
  if (['Safe User', 'Community Safe'].includes(name)) cat = 'safety';

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-transform hover:scale-105 ${colors[cat]}`}>
      <Icon size={12} strokeWidth={2.5} />
      {name}
    </div>
  );
};

export default BadgeItem;