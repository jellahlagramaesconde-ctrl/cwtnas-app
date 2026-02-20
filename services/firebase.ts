import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/storage";
import "firebase/compat/database";
import "firebase/compat/firestore";

// ------------------------------------------------------------------
// FINAL PRODUCTION CONFIGURATION
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAJ9RdhwFIUwXJ1kMrUg_ge30xaJNmD988",
  authDomain: "cwtnas-app-5b35b.firebaseapp.com",
  databaseURL: "https://cwtnas-app-5b35b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cwtnas-app-5b35b",
  storageBucket: "cwtnas-app-5b35b.firebasestorage.app",
  messagingSenderId: "245365354819",
  appId: "1:245365354819:web:dff259251b5908740d3ff6",
  measurementId: "G-1DRV495J35"
};

// Declare variables
let app: any;
let auth: firebase.auth.Auth;
let storage: firebase.storage.Storage;
let db: firebase.database.Database;
let firestore: firebase.firestore.Firestore;

/**
 * Checks if the current configuration is valid and not using placeholders.
 */
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE" && 
         !firebaseConfig.apiKey.includes("YOUR_API_KEY");
};

// Initialization Logic
try {
  if (isFirebaseConfigured()) {
    // Prevent duplicate initialization in HMR environments
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
    
    // Initialize specific services
    auth = firebase.auth();
    storage = firebase.storage();
    db = firebase.database(); 
    firestore = firebase.firestore(); 
    
    console.log("✅ Firebase Service Connected: " + firebaseConfig.projectId);
  } else {
    console.warn("⚠️ Firebase is not yet configured with a valid API Key.");
  }
} catch (error) {
  console.error("❌ Error initializing Firebase:", error);
}

/**
 * Persistence helpers (Maintained for flexibility)
 */
export const saveFirebaseConfig = (config: any) => {
  localStorage.setItem('cwtnas_firebase_config', JSON.stringify(config));
  window.location.reload();
};

export const resetFirebaseConfig = () => {
  localStorage.removeItem('cwtnas_firebase_config');
  window.location.reload();
};

export { app, auth, storage, db, firestore };
export default firebase;