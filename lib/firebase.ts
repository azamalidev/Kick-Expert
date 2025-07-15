import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1L5vYV9VMgtl0mYt1rHvzsqEuoWw3wmY",
  authDomain: "neww-428a4.firebaseapp.com",
  projectId: "neww-428a4",
  storageBucket: "neww-428a4.firebasestorage.app",
  messagingSenderId: "930562652386",
  appId: "1:930562652386:web:891d60ba8b41be6995c6bb",
  measurementId: "G-QJ1R980N50"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
