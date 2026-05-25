import React, { useEffect, useMemo, useState } from "react";
import {
  Clipboard,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Plus,
  Search,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import iconPuzzle from "@/assets/puzzleIcon.png";
import iconLudo from "@/assets/ludoIcon.png";
import iconChess from "@/assets/chessIcon.png";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useAuth } from "@/context/AuthContext";
import { formatCoins, useWallet } from "@/context/WalletContext";
import { apiClient } from "@/services/api";
import { useNavigate } from "@tanstack/react-router";

type VtuNetwork = "MTN" | "Airtel" | "Glo" | "9mobile";
type PackageType = "airtime" | "data";

type VtuPackage = {
  _id: string;
  network: VtuNetwork;
  type: PackageType;
  name: string;
  priceCoins: number;
  dataSize?: string;
  active: boolean;
};

type CoinTransaction = {
  _id: string;
  type: string;
  coins?: number;
  amount?: number;
  status: string;
  description: string;
  network?: string;
  packageName?: string;
  createdAt: string;
};

type ReferralSummary = {
  referralCode: string;
  totalReferrals: number;
  totalReferralCoinsEarned: number;
};

const networks: VtuNetwork[] = ["MTN", "Airtel", "Glo", "9mobile"];
const packageTypes: { label: string; value: PackageType }[] = [
  { label: "Airtime", value: "airtime" },
  { label: "Data", value: "data" },
];

const games = [
  { name: "Picture\nPuzzle", bg: "from-sky-400 to-blue-500", icon: iconPuzzle },
  { name: "Ludo", bg: "from-purple-400 to-violet-500", icon: iconLudo },
  { name: "Chess", bg: "from-green-400 to-emerald-500", icon: iconChess },
  { name: "Scrabble", bg: "from-orange-400 to-amber-500", icon: iconPuzzle },
];

const joinChallenges = [
  { game: "Picture Puzzle", amount: "500 coins" },
  { game: "Scrabble", amount: "800 coins" },
  { game: "Ludo", amount: "1,200 coins" },
  { game: "Chess", amount: "800 coins" },
];

const directChallenges = [
  { game: "Picture Puzzle", amount: "500 coins", from: "@DesignWizard" },
  { game: "Scrabble", amount: "800 coins", from: "@Fela" },
  { game: "Ludo", amount: "700 coins", from: "@Paul" },
];

const networkStyles: Record<VtuNetwork, string> = {
  MTN: "bg-yellow-400/15 text-yellow-200",
  Airtel: "bg-red-500/15 text-red-200",
  Glo: "bg-emerald-500/15 text-emerald-200",
  "9mobile": "bg-lime-500/15 text-lime-200",
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(false);
  const [packages, setPackages] = useState<VtuPackage[]>([]);
  const [activeNetwork, setActiveNetwork] = useState<VtuNetwork>("MTN");
  const [activeType, setActiveType] = useState<PackageType>("airtime");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [referrals, setReferrals] = useState<ReferralSummary>({
    referralCode: "",
    totalReferrals: 0,
    totalReferralCoinsEarned: 0,
  });
  const [marketLoading, setMarketLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { user, logout } = useAuth();
  const { coins, setLocalCoins } = useWallet();
  const navigate = useNavigate();

  const referralCode = referrals.referralCode || user?.referralCode || "";

  const groupedPackages = useMemo(() => {
    return packages.reduce<Record<VtuNetwork, Record<PackageType, VtuPackage[]>>>(
      (groups, item) => {
        groups[item.network][item.type].push(item);
        return groups;
      },
      {
        MTN: { airtime: [], data: [] },
        Airtel: { airtime: [], data: [] },
        Glo: { airtime: [], data: [] },
        "9mobile": { airtime: [], data: [] },
      },
    );
  }, [packages]);

  const visiblePackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groupedPackages[activeNetwork][activeType].filter((item) => {
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.network.toLowerCase().includes(query) ||
        item.dataSize?.toLowerCase().includes(query)
      );
    });
  }, [activeNetwork, activeType, groupedPackages, search]);

  const refreshTransactions = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.getWalletTransactions();
      setTransactions(res.transactions || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Unable to load transaction history"));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setMarketLoading(true);
      try {
        const [packagesRes, referralRes] = await Promise.all([
          apiClient.getPackages(),
          apiClient.getReferralSummary(),
          refreshTransactions(),
        ]);
        setPackages(packagesRes.packages || []);
        setReferrals(referralRes);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Unable to load dashboard data"));
      } finally {
        setMarketLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const handleCopyReferral = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied");
  };

  const handleShareReferral = async () => {
    if (!referralCode) return;

    const text = `Join Brain Blocks with my referral code ${referralCode}`;
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }

    await navigator.clipboard.writeText(text);
    toast.success("Invite message copied");
  };

  const handlePackagePurchase = async (selectedPackage: VtuPackage) => {
    if (coins < selectedPackage.priceCoins) {
      toast.error("Insufficient coins");
      return;
    }

    setPurchaseLoading(selectedPackage._id);
    try {
      const res = await apiClient.purchasePackage(selectedPackage._id);
      setLocalCoins(Number(res.coins ?? res.balance ?? 0));
      await refreshTransactions();
      toast.success(`${selectedPackage.name} purchased`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Purchase failed"));
    } finally {
      setPurchaseLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="flex justify-end max-w-md mx-auto space-y-5">
        <button
          onClick={handleLogout}
          className="bg-gradient-to-br from-[#dfe7ff] to-[#c9d6ff] text-slate-900 text-xs font-semibold px-4 py-2 mb-2 rounded-full"
        >
          Logout
        </button>
      </div>
      <div className="max-w-md mx-auto space-y-5">
        <div className="rounded p-5 bg-gradient-to-br from-[#dfe7ff] to-[#c9d6ff] text-slate-900 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Coin Balance</p>
              <div className="flex items-center gap-2 mt-2">
                <h2 className="text-lg font-bold">
                  {showBalance ? <>{formatCoins(coins)}</> : "********"}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  aria-label="Toggle coin balance"
                >
                  {showBalance ? (
                    <Eye className="w-4 h-4 text-[#0B2177] cursor-pointer" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-[#0B2177] cursor-pointer" />
                  )}
                </button>
              </div>
            </div>
            <button className="bg-[#0B2177] text-[#B6D8FF] text-xs font-semibold px-4 py-2 rounded-full">
              Withdraw
            </button>
          </div>
          <button
            onClick={() => navigate({ to: "/fundwallet" })}
            className="absolute bottom-5 right-5 flex items-center gap-1.5 text-sm font-semibold text-slate-900"
          >
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-3 h-3 text-white font-bold" strokeWidth={3} />
            </span>
            Get Coins
          </button>
        </div>

        <section className="rounded bg-secondary p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Referral Rewards</p>
              <p className="mt-1 text-xs text-muted-foreground">Earn 50 coins per signup</p>
            </div>
            <Gift className="h-5 w-5 text-amber-300" />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-sm bg-muted px-3 py-3">
            <span className="font-mono text-sm font-semibold tracking-wide">
              {referralCode || "Loading..."}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyReferral}
                className="rounded-full bg-white/10 p-2"
                aria-label="Copy referral code"
              >
                <Clipboard className="h-4 w-4" />
              </button>
              <button
                onClick={handleShareReferral}
                className="rounded-full bg-white/10 p-2"
                aria-label="Share referral code"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded bg-black/40 p-3">
              <p className="text-xs text-muted-foreground">Total referrals</p>
              <p className="mt-1 text-lg font-bold">{referrals.totalReferrals}</p>
            </div>
            <div className="rounded bg-black/40 p-3">
              <p className="text-xs text-muted-foreground">Referral coins</p>
              <p className="mt-1 text-lg font-bold">
                {formatCoins(referrals.totalReferralCoinsEarned)}
              </p>
            </div>
          </div>
        </section>

        <div>
          <h3 className="text-foreground font-semibold mb-3">Available Games</h3>
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {games.map((g) => (
                <CarouselItem key={g.name} className="pl-3 basis-auto">
                  <div
                    onClick={() => {
                      if (g.name === "Ludo") navigate({ to: "/ludo" });
                      if (g.name === "Chess") navigate({ to: "/createchallenge" });
                    }}
                    className={`w-28 h-32 rounded-2xl bg-gradient-to-br ${g.bg} p-3 flex flex-col justify-between relative overflow-hidden`}
                  >
                    <img
                      src={g.icon}
                      alt={g.name}
                      loading="lazy"
                      className="w-12 h-12 absolute top-2 right-2 object-contain"
                    />
                    <div className="mt-auto">
                      <p className="text-white font-bold text-sm leading-tight whitespace-pre-line">
                        {g.name}
                      </p>
                      <p className="text-black text-[10px] mt-1">
                        {g.name === "Ludo" ? "Play Online" : "Play Computer"}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <button
          onClick={() => navigate({ to: "/createchallenge" })}
          className="w-full bg-[#9FC8F6] text-white font-semibold py-4 rounded-full flex items-center justify-between px-6"
        >
          <span className="text-[#0B2177]">Create Challenge</span>
          <span className="w-7 h-7 rounded-full bg-[#385FF4] flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </span>
        </button>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-semibold">Airtime & Data</h3>
            <button
              onClick={() => navigate({ to: "/marketplace" })}
              className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-emerald-200"
            >
              <ShoppingBag className="h-4 w-4" />
              Marketplace
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search packages"
              className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm text-black outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {networks.map((network) => (
              <button
                key={network}
                onClick={() => setActiveNetwork(network)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  activeNetwork === network
                    ? "bg-white text-black"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {network}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-full bg-secondary p-1">
            {packageTypes.map((item) => (
              <button
                key={item.value}
                onClick={() => setActiveType(item.value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  activeType === item.value ? "bg-primary text-white" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {marketLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-36 animate-pulse rounded bg-secondary p-3">
                  <div className="h-5 w-16 rounded bg-white/10" />
                  <div className="mt-5 h-4 w-24 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-14 rounded bg-white/10" />
                  <div className="mt-5 h-8 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : visiblePackages.length ? (
            <div className="grid grid-cols-2 gap-3">
              {visiblePackages.map((item) => (
                <article
                  key={item._id}
                  className="rounded bg-secondary p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${networkStyles[item.network]}`}
                    >
                      {item.network}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                      {item.type}
                    </span>
                  </div>
                  <h4 className="mt-3 min-h-10 text-sm font-semibold text-foreground">
                    {item.name}
                  </h4>
                  {item.dataSize && (
                    <p className="mt-1 text-xs text-muted-foreground">{item.dataSize}</p>
                  )}
                  <p className="mt-3 text-sm font-bold">{formatCoins(item.priceCoins)}</p>
                  <button
                    onClick={() => handlePackagePurchase(item)}
                    disabled={purchaseLoading === item._id}
                    className="mt-3 w-full rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-60"
                  >
                    {purchaseLoading === item._id ? "Buying..." : "Buy"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded bg-secondary p-5 text-center text-sm text-muted-foreground">
              No packages found for this network and type.
            </div>
          )}
        </section>

        <section className="bg-secondary rounded-2xl p-5">
          <h3 className="text-foreground font-semibold">Join a Challenge</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Other Players have created random challenges,
            <br />
            You can join any of your choice.
          </p>
          <div className="mt-4 space-y-3">
            {joinChallenges.map((c) => (
              <div
                key={c.game}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0"
              >
                <div>
                  <p className="text-foreground text-sm font-medium">{c.game}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{c.amount}</p>
                </div>
                <button className="bg-muted text-[#1688D1] text-xs font-medium px-5 py-1.5 rounded-full">
                  Join
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-secondary rounded-2xl p-5">
          <h3 className="text-foreground font-semibold">Direct Challenge</h3>
          <p className="text-muted-foreground text-xs mt-1">Players who invited you to a game</p>
          <div className="mt-4 space-y-3">
            {directChallenges.map((c) => (
              <div
                key={`${c.game}-${c.from}`}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{c.game}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{c.amount}</p>
                </div>
                <p className="text-muted-foreground text-xs flex-1">{c.from}</p>
                <button className="bg-muted text-[#1688D1] text-xs font-medium px-5 py-1.5 rounded-full">
                  Join
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded bg-secondary p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-semibold">Coin Transactions</h3>
            {historyLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="mt-4 space-y-3">
            {transactions.length ? (
              transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {transaction.packageName ||
                        transaction.description ||
                        transaction.type.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()} - {transaction.status}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">
                    {formatCoins(transaction.coins ?? transaction.amount ?? 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded bg-black/30 p-4 text-center text-sm text-muted-foreground">
                No coin transactions yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
