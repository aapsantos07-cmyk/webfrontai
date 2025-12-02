// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// --- CRITICAL FIXES: Import specific service functions ---
// ADDED: connectFirestoreEmulator for local database connection
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// ADDED: connectAuthEmulator to link local code to the Auth emulator
import { getAuth, connectAuthEmulator } from "firebase/auth";
// --------------------------------------------------------


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
getAnalytics(app); 

// Initialize and Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);


// --- CRITICAL ADDITION: Connect to Emulators ---
// This block ensures the local application connects to the Emulators 
// (which should be configured in firebase.json to use dynamic ports).
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // 1. Connect Auth Emulator (Default port: 9099)
    connectAuthEmulator(auth, "http://localhost:9099");
    
    // 2. Connect Firestore Emulator (Default port: 8080)
    // This ensures client data writes and reads go to the local database.
    connectFirestoreEmulator(db, "localhost", 8080);
}