import React from 'react';
import { Code, PenTool, Video, Music, ShieldCheck, Star, Zap } from 'lucide-react';

export const COLORS = {
  primary: "from-indigo-600 to-violet-600",
  secondary: "from-emerald-500 to-teal-500",
};

// --- NEW: REQUIRED FOR DROPDOWNS ---
export const LOCAL_CATEGORIES = {
  'dev': 'Development',
  'design': 'Design',
  'marketing': 'Marketing',
  'writing': 'Writing',
  'video': 'Video Editing',
  'data': 'Data Entry',
  'music': 'Music & Audio'
};

// --- RICH CATEGORIES (For Academy/UI Display) ---
export const CATEGORIES = [
  { 
    id: 'dev', 
    name: "Development", 
    description: "Learn React, HTML, and CSS basics.",
    icon: <Code size={20} />, 
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", 
    xp: 500,
    count: "120+ Jobs"
  },
  { 
    id: 'design', 
    name: "Creative Design", 
    description: "Master color theory and layout.",
    icon: <PenTool size={20} />, 
    color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400", 
    xp: 450,
    count: "85+ Jobs"
  },
  { 
    id: 'video', 
    name: "Video & Animation", 
    description: "Editing cuts, transitions & formats.",
    icon: <Video size={20} />, 
    color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400", 
    xp: 400,
    count: "50+ Jobs"
  },
  { 
    id: 'music', 
    name: "Music & Audio", 
    description: "Bitrates, mixing and sound design.",
    icon: <Music size={20} />, 
    color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400", 
    xp: 300,
    count: "30+ Jobs"
  },
];

export const QUIZZES = {
  'dev': { question: "Which of these is a JavaScript Library?", options: ["Laravel", "React", "Django", "Flask"], answer: "React" },
  'design': { question: "What does RGB stand for?", options: ["Red Green Blue", "Real Great Background", "Red Gold Black"], answer: "Red Green Blue" },
  'video': { question: "Which format is standard for web video?", options: ["MP4", "PSD", "DOCX", "EXE"], answer: "MP4" },
  'music': { question: "What is a common audio bitrate?", options: ["320 kbps", "1080p", "4K", "RGB"], answer: "320 kbps" }
};

// --- BATTLES DATA ---
export const BATTLES = [
  {
    id: 1,
    title: "Logo Design: Space Cafe",
    description: "Design a modern, minimalist logo for a futuristic coffee shop on Mars.",
    reward: "5000 XP + 'Champion' Badge",
    participants: 12,
    timeLeft: "2 Days",
    entries: [
       { id: 101, user: "Rahul K.", image: "https://via.placeholder.com/150/000000/FFFFFF/?text=SpaceCafe1", votes: 45 },
       { id: 102, user: "Sarah M.", image: "https://via.placeholder.com/150/1a1a1a/FFFFFF/?text=SpaceCafe2", votes: 32 },
    ]
  },
  {
    id: 2,
    title: "Code Challenge: React Counter",
    description: "Build the most creative counter app using React & Tailwind.",
    reward: "3000 XP + 'Code Ninja' Badge",
    participants: 8,
    timeLeft: "5 Days",
    entries: []
  }
];

// --- PRICING PLANS ---
export const PRICING_PLANS = [
  {
    id: 'starter',
    name: "Starter Verification",
    price: 19,
    icon: <ShieldCheck size={32} className="text-blue-500" />,
    color: "from-blue-400 to-blue-600",
    features: [
      "Basic 'Verified' Badge",
      "Apply to 5 Jobs/Day",
      "Standard Support"
    ]
  },
  {
    id: 'pro',
    name: "Pro Freelancer",
    price: 29,
    icon: <Star size={32} className="text-yellow-400" />,
    color: "from-yellow-400 to-orange-500",
    recommended: true,
    features: [
      "Gold 'Pro' Badge",
      "Unlimited Job Applications",
      "Priority Support",
      "Profile Highlight"
    ]
  },
  {
    id: 'elite',
    name: "Elite Status",
    price: 49,
    icon: <Zap size={32} className="text-purple-500" />,
    color: "from-purple-500 to-pink-600",
    features: [
      "Diamond 'Elite' Badge",
      "Top of Search Results",
      "0% Commission on First Job",
      "Direct Client Access"
    ]
  }
];