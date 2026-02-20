import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth, firestore } from '../services/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: firebase.User | null;
  loading: boolean;
  authError: string | null;
  isAdmin: boolean;
  isDriver: boolean;
  isResident: boolean;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  firebaseUser: null,
  loading: true,
  authError: null,
  isAdmin: false,
  isDriver: false,
  isResident: false,
  logout: async () => {},
  deleteAccount: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is not initialized (missing config), stop loading so we can show Login page (which will show config error)
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      setAuthError(null); 
      
      if (user) {
        // Enforce Email Verification
        try {
          await user.reload(); 
        } catch (e) {
          console.error("Failed to reload user", e);
        }

        if (!user.emailVerified) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        
        try {
          if (!firestore) {
              throw new Error("Firestore not initialized");
          }

          const userDocRef = firestore.collection("users").doc(user.uid);
          const userDocSnap = await userDocRef.get();
          
          let userData: any = null;

          if (userDocSnap.exists) {
            userData = userDocSnap.data();
          } else {
             // SELF-HEALING: If user exists in Auth but not in Firestore, create a default profile.
             console.log("User profile missing. Creating default profile...");
             const newProfile = {
                uid: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                role: UserRole.RESIDENT, // Default to Resident
                zone: 'Unassigned',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
             };
             
             await userDocRef.set(newProfile);
             userData = newProfile;
          }

          setCurrentUser({
            id: user.uid,
            name: userData.name || user.displayName || 'User',
            email: userData.email || user.email || '',
            role: userData.role || UserRole.RESIDENT,
            zone: userData.zone || 'Unassigned',
            plateNumber: userData.plateNumber,
            vehicleType: userData.vehicleType
          });

        } catch (error: any) {
           console.error("Error fetching user profile:", error);
           
           if (error.code === 'permission-denied') {
              setAuthError("Access denied. Please check your Database Rules in Firebase Console.");
              setCurrentUser(null);
              await auth.signOut();
           } else {
              // Graceful fallback if database is unreachable
              setCurrentUser({
                  id: user.uid,
                  name: user.displayName || 'User',
                  email: user.email || '',
                  role: UserRole.RESIDENT,
                  zone: 'Unassigned'
              });
              setAuthError("Offline Mode: User profile could not be synced.");
           }
        } finally {
            setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const deleteAccount = async () => {
    try {
      if (!auth.currentUser) throw new Error("No user logged in");
      
      const uid = auth.currentUser.uid;
      const user = auth.currentUser;

      if (firestore) {
         try {
           await firestore.collection("users").doc(uid).delete();
         } catch (dbError) {
            console.error("Error deleting user document from Firestore:", dbError);
         }
      }

      await user.delete();
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (error: any) {
      console.error("Delete Account Error:", error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("Security Requirement: Please log out and log in again before deleting your account.");
      }
      throw error;
    }
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    authError,
    isAdmin: currentUser?.role === UserRole.ADMIN,
    isDriver: currentUser?.role === UserRole.DRIVER,
    isResident: currentUser?.role === UserRole.RESIDENT,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};