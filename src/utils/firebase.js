import { initializeApp } from "firebase/app";
import { getAuth, initializeRecaptchaConfig } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize if we have config
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;

let recaptchaPromise = null;

export const ensureRecaptchaConfigLoaded = async () => {
  if (!auth) return;
  if (!recaptchaPromise) {
    recaptchaPromise = initializeRecaptchaConfig(auth).catch((err) => {
      console.warn("reCAPTCHA Enterprise config init failed:", err.message);
      recaptchaPromise = null;
    });
  }
  await recaptchaPromise;
};

// Fire immediately on load as well
if (auth) {
  ensureRecaptchaConfigLoaded();
}

export { app, auth };
