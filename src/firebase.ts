import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAnooE7_uIEv3gvZjaz0r1kuEQABViEi_0",
  authDomain: "recyclage-flims.firebaseapp.com",
  projectId: "recyclage-flims",
  storageBucket: "recyclage-flims.appspot.com",
  messagingSenderId: "163905364567",
  appId: "1:163905364567:web:8d1a2d8fad8ef8b89f7912",
  measurementId: "G-Z4K55MVP94"
};

// Initialize Firebase with custom settings for WebContainer environment
const app = initializeApp(firebaseConfig, {
  experimentalForceLongPolling: true, // Enable long polling
  useFetchStreams: false // Disable fetch streams
});

// Initialize Firestore with custom settings
export const db = getFirestore(app);

// Initialize Auth with persistence
export const auth = getAuth(app);

// Set persistence to LOCAL to handle network issues better
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export default app;