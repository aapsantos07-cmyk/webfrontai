import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { secureError, secureLog } from '../utils/security';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentClientData, setCurrentClientData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminSettings, setAdminSettings] = useState({
    name: "Admin User",
    email: import.meta.env.VITE_MASTER_ADMIN_EMAIL?.toLowerCase() || '',
    maintenanceMode: false
  });
  const isSigningUp = useRef(false);
  const navigate = useNavigate();

  const MASTER_ADMIN_EMAIL = import.meta.env.VITE_MASTER_ADMIN_EMAIL?.toLowerCase() || '';

  // Listen to Firebase auth state changes
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("Firebase auth timed out - forcing app load.");
        setLoading(false);
      }
    }, 3000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimer);

      // Skip if we're in the middle of signup
      if (isSigningUp.current) return;

      if (user) {
        const isMaster = user.email.toLowerCase() === MASTER_ADMIN_EMAIL;

        try {
          const docRef = doc(db, "clients", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = isMaster ? 'admin' : (data.role || 'client');

            setCurrentUser(user);
            setUserRole(role);
            setCurrentClientData({ id: user.uid, ...data });

            // Handle password reset redirect
            if (data.requiresPasswordReset && !isMaster) {
              navigate('/reset-password', {
                state: { user, userData: data }
              });
            } else {
              // Redirect to appropriate dashboard after auth
              if (role === 'admin') {
                if (window.location.pathname === '/login' || window.location.pathname === '/') {
                  navigate('/admin/dashboard');
                }
              } else {
                if (window.location.pathname === '/login' || window.location.pathname === '/') {
                  navigate('/dashboard/overview');
                }
              }
            }
          } else {
            // User authenticated but no Firestore data
            setCurrentUser(null);
            setUserRole(null);
            setCurrentClientData(null);
          }
        } catch (err) {
          secureError("Error fetching user data on auth change:", err);

          if (err.message && err.message.includes("INTERNAL ASSERTION FAILED")) {
            alert("Session Error: Please clear your browser cache and refresh.");
          }
        }
      } else {
        // User logged out
        setCurrentUser(null);
        setUserRole(null);
        setCurrentClientData(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(safetyTimer);
    };
  }, [navigate, MASTER_ADMIN_EMAIL]);

  // Real-time Firestore listeners for client/admin data
  useEffect(() => {
    if (loading) return;
    if (!currentClientData && userRole !== 'admin') return;

    let unsubscribe;

    if (userRole === 'admin') {
      // Admin: Listen to all clients
      const q = collection(db, "clients");
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        (err) => secureLog("Admin listen error", err)
      );
    } else if (userRole === 'client' && currentClientData?.id) {
      // Client: Listen to own data
      const docRef = doc(db, "clients", currentClientData.id);
      unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setCurrentClientData({ id: docSnap.id, ...docSnap.data() });
          }
        },
        (err) => secureLog("Client listen error", err)
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userRole, currentClientData?.id, loading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      secureError("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    userRole,
    currentClientData,
    clients,
    loading,
    adminSettings,
    isSigningUp,
    MASTER_ADMIN_EMAIL,
    setCurrentClientData,
    setClients,
    setAdminSettings,
    handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
