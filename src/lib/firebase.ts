import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id-for-build"
};

// 1. Initialize the Firebase App (ensure we don't initialize twice)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. 🔥 Initialize Firestore SAFELY
let dbInstance;

// Check if we are running inside a real web browser
if (typeof window !== "undefined") {
  // We are in the browser! Turn on the heavy-duty offline cache.
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager() 
    })
  });
} else {
  // We are on Vercel's Build Server! Just use the standard database connection.
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const storage = getStorage(app);