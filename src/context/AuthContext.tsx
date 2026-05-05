import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { apiClient } from "../services/api";

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  dob?: string;
  phone?: string;
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

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

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

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);

    try {
      const res = await apiClient.register(data);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
