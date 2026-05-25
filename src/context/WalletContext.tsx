import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

type Provider = "paystack" | "opay";

type WalletContextType = {
  coins: number;
  balance: number;
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<number>;
  setLocalCoins: (coins: number) => void;
  fundWallet: (provider: Provider, amount: number) => Promise<void>;
  verifyFunding: (provider: Provider, reference: string) => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const formatCoins = (amount: number) =>
  `${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(amount || 0)} coins`;

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setCoins(0);
      return 0;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.getWalletBalance();
      const nextCoins = Number(res.coins ?? res.balance ?? 0);
      setCoins(nextCoins);
      return nextCoins;
    } catch (err: any) {
      setError(err.message || "Unable to fetch coin balance");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fundWallet = useCallback(async (provider: Provider, amount: number) => {
    setLoading(true);
    setError(null);

    try {
      const callbackUrl = `${window.location.origin}/fundwallet?provider=${provider}`;
      const res = await apiClient.initializeWalletFunding({
        provider,
        amount,
        callbackUrl,
      });

      window.location.href = res.authorizationUrl;
    } catch (err: any) {
      setError(err.message || "Unable to initialize payment");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setLocalCoins = useCallback((nextCoins: number) => {
    setCoins(Number(nextCoins || 0));
  }, []);

  const verifyFunding = useCallback(async (provider: Provider, reference: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.verifyWalletFunding({ provider, reference });
      const nextCoins = Number(res.coins ?? res.balance ?? 0);
      setCoins(nextCoins);
    } catch (err: any) {
      setError(err.message || "Unable to verify payment");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const userCoins = user?.wallet?.coins ?? user?.wallet?.balance;
      if (typeof userCoins === "number") {
        setCoins(userCoins);
      }
      fetchBalance().catch(() => {});
    } else {
      setCoins(0);
    }
  }, [isAuthenticated, user?.wallet?.coins, user?.wallet?.balance, fetchBalance]);

  const value = useMemo(
    () => ({
      coins,
      balance: coins,
      loading,
      error,
      fetchBalance,
      setLocalCoins,
      fundWallet,
      verifyFunding,
    }),
    [coins, loading, error, fetchBalance, setLocalCoins, fundWallet, verifyFunding]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
};
