import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { apiClient } from "../services/api";

export type User = {
  _id?: string;
  id: string;
  firstName: string;
  username?: string;
  email: string;
  avatar?: string | null;
  referralCode?: string;
  wallet?: {
    inactiveCoins?: number;
    activeCoins?: number;
    coins?: number;
    balance?: number;
  };
};

type RegisterData = {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  dob?: string;
  phone?: string;
  state: string;
  referralCode?: string;
  avatar?: File | null;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const initialAuthContext: AuthContextType = {
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {
    throw new Error("AuthProvider has not been initialized");
  },
  register: async () => {
    throw new Error("AuthProvider has not been initialized");
  },
  logout: () => {},
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = user?._id || user?.id;

  // restore session on refresh
  useEffect(() => {
    const init = async () => {
      if (!apiClient.getToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.getMe();
        setUser(res.user);
      } catch {
        apiClient.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const res = await apiClient.login(email, password);
      setUser(res.user);
      apiClient.updatePresence(true).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);

    try {
      const res = await apiClient.register(data);
      setUser(res.user);
      apiClient.updatePresence(true).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiClient.sendPresenceBeacon(false);
    apiClient.updatePresence(false).catch(() => {});
    apiClient.logout();
    setUser(null);
  };

  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined" || typeof document === "undefined") return;

    apiClient.updatePresence(true).catch(() => {});

    const handlePageHide = () => {
      apiClient.sendPresenceBeacon(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        apiClient.sendPresenceBeacon(false);
        return;
      }

      apiClient.updatePresence(true).catch(() => {});
    };

    const heartbeat = window.setInterval(() => {
      apiClient.updatePresence(true).catch(() => {});
    }, 60000);

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
