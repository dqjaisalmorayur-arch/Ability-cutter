import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const config = {
  ...firebaseConfig,
  apiKey: "AIzaSyAQBH001UINFz-CikTEgpnnJglvHw2hryc",
  authDomain: "glass-sequence-474612-f8.firebaseapp.com",
  projectId: "glass-sequence-474612-f8",
  storageBucket: "glass-sequence-474612-f8.firebasestorage.app",
  messagingSenderId: "674312894394",
  appId: "1:674312894394:web:df76046ffd15cb02b58f83"
};

const app = initializeApp(config);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
