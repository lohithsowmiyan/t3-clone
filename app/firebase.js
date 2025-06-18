// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLrPhNq1eDGGM5mIL53BNaLanQSOH3R7Q",
  authDomain: "t3-clone-48b60.firebaseapp.com",
  projectId: "t3-clone-48b60",
  storageBucket: "t3-clone-48b60.firebasestorage.app",
  messagingSenderId: "578434809246",
  appId: "1:578434809246:web:c4c36c9aa1c7cad0f36a8f",
  measurementId: "G-SD08QQDEZ8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { signInWithPopup, signOut };
