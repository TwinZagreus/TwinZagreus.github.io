import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSession, login as loginRequest, logout as logoutRequest } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [username, setUsername] = useState(null);

  const refreshSession = async () => {
    setIsCheckingSession(true);

    try {
      const session = await getSession();
      setIsAuthenticated(session.is_authenticated);
      setUsername(session.username ?? null);
    } catch {
      setIsAuthenticated(false);
      setUsername(null);
    } finally {
      setIsCheckingSession(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const value = useMemo(
    () => ({
      closeLoginModal: () => setLoginModalOpen(false),
      consumePendingRedirect: () => {
        const target = pendingRedirect;
        setPendingRedirect(null);
        return target;
      },
      isAuthenticated,
      isCheckingSession,
      login: async (payload) => {
        const session = await loginRequest(payload);
        setIsAuthenticated(session.is_authenticated);
        setUsername(session.username ?? null);
        setLoginModalOpen(false);
        return session;
      },
      loginModalOpen,
      logout: async () => {
        await logoutRequest();
        setIsAuthenticated(false);
        setUsername(null);
      },
      openLoginModal: (redirectTo = null) => {
        if (redirectTo)
          setPendingRedirect(redirectTo);
        setLoginModalOpen(true);
      },
      pendingRedirect,
      refreshSession,
      username,
    }),
    [isAuthenticated, isCheckingSession, loginModalOpen, pendingRedirect, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
