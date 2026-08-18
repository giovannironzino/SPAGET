import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Public Firebase config retrieved from configuration
const firebaseConfig = {
  projectId: "studio-4606614249-ab7ca",
  appId: "1:680822550263:web:917c4b6f5003fb0591edf2",
  apiKey: "AIzaSyD-3ptoSblWXgE1BwIOWyHdjCG271jNutU",
  authDomain: "studio-4606614249-ab7ca.firebaseapp.com",
  storageBucket: "studio-4606614249-ab7ca.firebasestorage.app",
  messagingSenderId: "680822550263"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with custom Database ID
export const db = initializeFirestore(app, {}, "ai-studio-spaget-8ff321d3-1f1c-4317-bc0f-a0344902afe2");

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
