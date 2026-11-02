import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import AuthModal from "@/components/AuthModal";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function authErrorMessage(err) {
  const map = {
    "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups for this site and retry.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/unauthorized-domain":
      "This domain isn't authorised. In Firebase Console → Authentication → Settings → Authorized domains, add it.",
    "auth/operation-not-allowed":
      "Google sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.",
    "auth/internal-error":
      "Google sign-in is misconfigured. In Firebase Console → Authentication → Sign-in method → Google: turn it off, save, turn it on again, save.",
  };
  return map[err?.code] || err?.message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signInGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
      throw e;
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      openAuth: () => setModalOpen(true),
      signInGoogle,
      logout,
    }),
    [user, loading, signInGoogle, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AuthContext.Provider>
  );
}
