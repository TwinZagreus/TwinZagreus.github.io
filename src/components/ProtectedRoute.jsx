"use client";

import { useEffect } from "react";
import { Navigate, useLocation } from "../lib/navigation";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isCheckingSession, openLoginModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isCheckingSession && !isAuthenticated) {
      openLoginModal(location.pathname);
    }
  }, [isAuthenticated, isCheckingSession, location.pathname, openLoginModal]);

  if (isCheckingSession)
    return null;

  if (!isAuthenticated)
    return <Navigate replace to="/blog" />;

  return children;
}
