import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLUg6OeBQFYLWYL9c1ChclIoJQHbN1XwA",
  authDomain: "www.teenversehub.in",
  projectId: "teenverse-1d91f",
  storageBucket: "teenverse-1d91f.firebasestorage.app",
  messagingSenderId: "285272738566",
  appId: "1:285272738566:web:1c617667c41f0bd7a6ec87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
