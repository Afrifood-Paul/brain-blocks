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

type WalletPayload = {
  activeCoins?: number;
  inactiveCoins?: number;
  coins?: number;
  balance?: number;
};

type WalletContextType = {
  coins: number;
  balance: number;
  activeCoins: number;
  inactiveCoins: number;
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
  const wallet = user?.wallet;
  const walletActiveCoins = wallet?.activeCoins;
  const walletCoins = wallet?.coins;
  const walletBalance = wallet?.balance;
  const [coins, setCoins] = useState(0);
  const [inactiveCoins, setInactiveCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const applyWallet = useCallback((nextWallet: WalletPayload) => {
    const nextActiveCoins = Number(
      nextWallet.activeCoins ?? nextWallet.coins ?? nextWallet.balance ?? 0,
    );
    setCoins(nextActiveCoins);
    setInactiveCoins(Number(nextWallet.inactiveCoins ?? 0));
    return nextActiveCoins;
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setCoins(0);
      setInactiveCoins(0);
      return 0;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.getWalletBalance();
      return applyWallet(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to fetch coin balance"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyWallet, isAuthenticated]);

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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to initialize payment"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setLocalCoins = useCallback((nextCoins: number) => {
    setCoins(Number(nextCoins || 0));
  }, []);

  const verifyFunding = useCallback(
    async (provider: Provider, reference: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.verifyWalletFunding({ provider, reference });
        applyWallet(res);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Unable to verify payment"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyWallet],
  );

  useEffect(() => {
    if (isAuthenticated) {
      const userCoins = walletCoins ?? walletBalance;
      if (typeof walletActiveCoins === "number" || typeof userCoins === "number") {
        applyWallet(wallet || {});
      }
      fetchBalance().catch(() => {});
    } else {
      setCoins(0);
      setInactiveCoins(0);
    }
  }, [
    applyWallet,
    isAuthenticated,
    wallet,
    walletActiveCoins,
    walletCoins,
    walletBalance,
    fetchBalance,
  ]);

  const value = useMemo(
    () => ({
      coins,
      balance: coins,
      activeCoins: coins,
      inactiveCoins,
      loading,
      error,
      fetchBalance,
      setLocalCoins,
      fundWallet,
      verifyFunding,
    }),
    [coins, inactiveCoins, loading, error, fetchBalance, setLocalCoins, fundWallet, verifyFunding],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
};
