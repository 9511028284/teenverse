import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmUKR4IQnKjacWiGBulmEpbePmLUsihaM",
  authDomain: "teenverse-app.firebaseapp.com",
  projectId: "teenverse-app",
  storageBucket: "teenverse-app.firebasestorage.app",
  messagingSenderId: "194598066430",
  appId: "1:194598066430:web:75febac18920121995edaf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export Firestore
export const db = getFirestore(app);