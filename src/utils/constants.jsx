import React from 'react';
import { Code, PenTool, Video, Music } from 'lucide-react';

export const COLORS = {
  primary: "from-indigo-600 to-violet-600",
  secondary: "from-emerald-500 to-teal-500",
};

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