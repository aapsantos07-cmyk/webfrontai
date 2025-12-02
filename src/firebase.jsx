// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <--- Add this import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSMPU7cbu4NF_wkgGeNaYkrxkVzfew92A",
  authDomain: "webfrontai-42249.firebaseapp.com",
  projectId: "webfrontai-42249",
  storageBucket: "webfrontai-42249.firebasestorage.app",
  messagingSenderId: "796371334200",
  appId: "1:796371334200:web:7d880d060e9ce0057362cd",
  measurementId: "G-C6F9FJMF8G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (optional)
export const analytics = getAnalytics(app); 

// Initialize and Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // <--- Export storage