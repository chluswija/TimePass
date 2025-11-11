import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAcJb3qAI4LtyonApJCXUFeDW7QpCOg7W8",
  authDomain: "time-pass-c1b91.firebaseapp.com",
  projectId: "time-pass-c1b91",
  storageBucket: "time-pass-c1b91.firebasestorage.app",
  messagingSenderId: "1016582690891",
  appId: "1:1016582690891:web:78d971ada007e0350b15ce",
  measurementId: "G-ZN8EZVY5P4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
