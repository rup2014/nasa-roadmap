import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB64wgxfi2qmNcOZDl70hYMqY5AN8eAXBk",
  authDomain: "nasa-roadmap.firebaseapp.com",
  projectId: "nasa-roadmap",
  storageBucket: "nasa-roadmap.firebasestorage.app",
  messagingSenderId: "1088500912828",
  appId: "1:1088500912828:web:4715d3e1d1ec19805936b9",
  measurementId: "G-121K0PXNYQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();