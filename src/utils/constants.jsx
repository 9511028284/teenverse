import React from 'react';
import { 
  Code, PenTool, Video, Music, ShieldCheck, Star, Zap, Feather 
} from 'lucide-react';

// --- REQUIRED FOR DASHBOARD LOGIC (Fixes the crash) ---
export const APP_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
  PAID: 'Paid',
  DISPUTED: 'Disputed'
};

// --- THEME COLORS ---
export const COLORS = {
  primary: "from-indigo-600 to-violet-600",
  secondary: "from-emerald-500 to-teal-500",
};

// --- REQUIRED FOR DROPDOWNS ---
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

// --- QUIZZES ---
export const QUIZZES = {
  dev: {
    title: "Web Development 101",
    icon: "Code",
    xp: 1000,
    questions: [
      { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Links", "Hyper Transfer Mode Link"], a: "Hyper Text Markup Language" },
      { q: "Which HTML tag is used for the largest heading?", options: ["<head>", "<h6>", "<h1>"], a: "<h1>" },
      { q: "What is the correct CSS syntax to change text color?", options: ["text-color: red;", "color: red;", "font-color: red;"], a: "color: red;" },
      { q: "Which symbol is used for comments in JavaScript?", options: ["//", "", "/* */"], a: "//" },
      { q: "What does API stand for?", options: ["Apple Pie Interface", "Application Programming Interface", "Advanced Protocol Interaction"], a: "Application Programming Interface" },
      { q: "Which Git command saves your changes locally?", options: ["git push", "git commit", "git save"], a: "git commit" },
      { q: "What is 'Responsive Design'?", options: ["Design that talks back", "Design that adapts to screen sizes", "Design that loads fast"], a: "Design that adapts to screen sizes" },
      { q: "Which language is primarily used for styling web pages?", options: ["HTML", "CSS", "Python"], a: "CSS" },
      { q: "What is a 'Bug' in programming?", options: ["A virus", "An error or flaw in code", "A feature"], a: "An error or flaw in code" },
      { q: "In React, what is used to manage state?", options: ["useState", "useStyle", "useMemory"], a: "useState" }
    ]
  },
  design: {
    title: "Graphic Design Fundamentals",
    icon: "PenTool",
    xp: 1000,
    questions: [
      { q: "What are the three primary colors?", options: ["Red, Green, Blue", "Red, Yellow, Blue", "Cyan, Magenta, Yellow"], a: "Red, Yellow, Blue" },
      { q: "Which file format supports transparency?", options: ["JPG", "PNG", "TXT"], a: "PNG" },
      { q: "What is 'White Space'?", options: ["Empty space around elements", "The color white", "A printing error"], a: "Empty space around elements" },
      { q: "What is the difference between Serif and Sans-Serif?", options: ["Serif has decorative feet", "Sans-Serif is old fashioned", "No difference"], a: "Serif has decorative feet" },
      { q: "What does CMYK stand for?", options: ["Cyan Magenta Yellow Key (Black)", "Color Make Your Kit", "Computer Mode Year Key"], a: "Cyan Magenta Yellow Key (Black)" },
      { q: "Which tool is best for Vector graphics?", options: ["Photoshop", "Illustrator", "Paint"], a: "Illustrator" },
      { q: "What is 'Kerning'?", options: ["Space between lines", "Space between characters", "Font size"], a: "Space between characters" },
      { q: "What implies 'Hierarchy' in design?", options: ["Using different sizes/weights to show importance", "Putting everything at the top", "Using the same color"], a: "Using different sizes/weights to show importance" },
      { q: "What is a 'Wireframe'?", options: ["A 3D model", "A skeletal blueprint of a layout", "A cable management system"], a: "A skeletal blueprint of a layout" },
      { q: "What color code is #000000?", options: ["White", "Black", "Blue"], a: "Black" }
    ]
  },
  writing: {
    title: "Content & Copywriting",
    icon: "Feather",
    xp: 1000,
    questions: [
      { q: "What is SEO?", options: ["Search Engine Optimization", "Social Engagement Online", "Site Entry Order"], a: "Search Engine Optimization" },
      { q: "What is a 'Call to Action' (CTA)?", options: ["A phone number", "A prompt for the user to take a specific step", "A complaint form"], a: "A prompt for the user to take a specific step" },
      { q: "Which voice is generally preferred in web writing?", options: ["Passive Voice", "Active Voice", "Silent Voice"], a: "Active Voice" },
      { q: "What is 'Plagiarism'?", options: ["Writing original content", "Using someone else's work without credit", "Editing text"], a: "Using someone else's work without credit" },
      { q: "What is a 'Headline'?", options: ["The title of an article", "The footer", "The navigation bar"], a: "The title of an article" },
      { q: "In freelancing, what is a 'Revision'?", options: ["Starting over", "Making changes based on client feedback", "Deleting the file"], a: "Making changes based on client feedback" },
      { q: "What represents 'Tone' in writing?", options: ["The font size", "The attitude/emotion conveyed", "The word count"], a: "The attitude/emotion conveyed" },
      { q: "What is 'Proofreading'?", options: ["Checking for errors", "Writing the first draft", "Publishing"], a: "Checking for errors" },
      { q: "Who is the 'Target Audience'?", options: ["Everyone", "The specific group the content is for", "The writer"], a: "The specific group the content is for" },
      { q: "What is a 'Portfolio'?", options: ["A collection of your best work", "A resume", "A bank account"], a: "A collection of your best work" }
    ]
  }
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