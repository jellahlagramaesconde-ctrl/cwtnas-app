import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/storage";
import "firebase/compat/database";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

let app: any;
let auth: firebase.auth.Auth;
let storage: firebase.storage.Storage;
let db: firebase.database.Database;
let firestore: firebase.firestore.Firestore;

export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE" && 
         !firebaseConfig.apiKey.includes("YOUR_API_KEY");
};

try {
  if (isFirebaseConfigured()) {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
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
