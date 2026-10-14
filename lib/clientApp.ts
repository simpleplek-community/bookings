import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Keep the public shell renderable when Firebase variables are unavailable in a preview.
// Auth operations already handle configuration and credential failures in components/auth.tsx.
const app = getApps().length === 0
  ? initializeApp({
      ...firebaseConfig,
      projectId: firebaseConfig.projectId || "simpleplek-9d373",
      authDomain: firebaseConfig.authDomain || "simpleplek-9d373.firebaseapp.com",
    })
  : getApp();

// Firebase Auth can fail during preview startup when public client variables are not
// injected yet. Keep the app shell available so auth UI can show its existing fallback.
export const auth = (() => {
  try {
    return getAuth(app);
  } catch (error) {
    console.warn("[Firebase Auth] Client configuration is unavailable.", error);
    return null;
  }
})();
export const db = getFirestore(app);
export default app;
