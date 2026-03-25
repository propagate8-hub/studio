import { initializeApp } from "firebase/app";
// 🔥 We bring in the heavy-duty caching tools here:
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 1. Initialize the Firebase App
export const app = initializeApp(firebaseConfig);

// 2. 🔥 Initialize Firestore WITH Offline Persistence Enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    // This allows offline mode to work even if the student has multiple tabs open
    tabManager: persistentMultipleTabManager() 
  })
});