import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // 👇 Replaced semicolons with commas and fixed stray quotes
  apiKey: import.meta.env.VITE_firebase_apikeys,
  authDomain: import.meta.env.VITE_firebase_authdomain,
  projectId: "teenverse-app", // Added the missing opening quote here
  storageBucket: import.meta.env.VITE_firebase_bucket, // Removed the stray quote here
  messagingSenderId: import.meta.env.VITE_firebase_messageid,
  appId: import.meta.env.VITE_firebase_appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export Firestore
export const db = getFirestore(app);

// Initialize and Export Auth
export const auth = getAuth(app);
auth.useDeviceLanguage(); // Automatically formats +91 for India if needed




