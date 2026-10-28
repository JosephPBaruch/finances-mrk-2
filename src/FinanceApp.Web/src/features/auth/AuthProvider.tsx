import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthStatus } from "../../shared/api/apiTypes";
import { authApi } from "./authApi";

type AuthContextValue = {
  status: AuthStatus | null;
  loading: boolean;
  setup: (password: string) => Promise<void>;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await authApi.status());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshStatus(); }, [refreshStatus]);
  useEffect(() => {
    const handleUnauthorized = () => void refreshStatus();
    window.addEventListener("finance:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("finance:unauthorized", handleUnauthorized);
  }, [refreshStatus]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    loading,
    setup: async (password) => setStatus(await authApi.setup(password)),
    login: async (password) => setStatus(await authApi.login(password)),
    logout: async () => {
      await authApi.logout();
      setStatus((current) => current ? { ...current, isAuthenticated: false } : current);
    },
  }), [loading, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
