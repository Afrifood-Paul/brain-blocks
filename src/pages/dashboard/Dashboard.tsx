import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/context/AuthContext";
import { formatCoins, useWallet } from "@/context/WalletContext";
import { apiClient } from "@/services/api";
import { useNavigate } from "@tanstack/react-router";
import { copyToClipboard } from "@/utils/copyToClipboard";
import { GAMES } from "@/constants/games";
import NotificationsBell from "@/components/NotificationsBell";
import coinIcon from "../../assets/walletIcon.png";
import shareIcon from "../../assets/shareReferralIcon.png";
import copyIcon from "../../assets/copyrefferalIcon.png";
import marketplaceIcon from "../../assets/marketplaceIcon.png";
import logoutIcon from "../../assets/logoutIcon.png";

// type VtuNetwork = "MTN" | "Airtel" | "Glo" | "9mobile";
// type PackageType = "airtime" | "data";

// type VtuPackage = {
//   _id: string;
//   network: VtuNetwork;
//   type: PackageType;
//   name: string;
//   priceCoins: number;
//   dataSize?: string;
//   active: boolean;
// };

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

// const networks: VtuNetwork[] = ["MTN", "Airtel", "Glo", "9mobile"];
// const packageTypes: { label: string; value: PackageType }[] = [
//   { label: "Airtime", value: "airtime" },
//   { label: "Data", value: "data" },
// ];

// const joinChallenges = [
//   { game: "Picture Puzzle", amount: "500 coins" },
//   { game: "Scrabble", amount: "800 coins" },
//   { game: "Ludo", amount: "1,200 coins" },
//   { game: "Chess", amount: "800 coins" },
// ];

// const directChallenges = [
//   { game: "Picture Puzzle", amount: "500 coins", from: "@DesignWizard" },
//   { game: "Scrabble", amount: "800 coins", from: "@Fela" },
//   { game: "Ludo", amount: "700 coins", from: "@Paul" },
// ];

// const networkStyles: Record<VtuNetwork, string> = {
//   MTN: "bg-yellow-400/15 text-yellow-200",
//   Airtel: "bg-red-500/15 text-red-200",
//   Glo: "bg-emerald-500/15 text-emerald-200",
//   "9mobile": "bg-lime-500/15 text-lime-200",
// };

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const Dashboard = () => {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [referrals, setReferrals] = useState<ReferralSummary>({
    referralCode: "",
    totalReferrals: 0,
    totalReferralCoinsEarned: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const { user, logout } = useAuth();
  const { activeCoins, inactiveCoins } = useWallet();
  const navigate = useNavigate();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 3);
  const referralCode = referrals.referralCode || user?.referralCode || "";
  const userId = user?._id || user?.id;

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
      try {
        const [, referralRes] = await Promise.all([
          refreshTransactions(),
          apiClient.getReferralSummary(),
        ]);

        setReferrals(referralRes);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Unable to load dashboard data"));
      }
    };

    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const handleCopyReferral = async () => {
    if (!referralCode) {
      toast.error("No referral code available");
      return;
    }

    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    await copyToClipboard(referralLink);
    toast.success("Referral link copied");
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

  const wallets = [
    {
      title: "Bonus Wallet",
      balance: inactiveCoins,
    },
    {
      title: "Active Wallet",
      balance: activeCoins,
    },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <header className="max-w-sm mx-auto space-y-5 mb-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate({ to: "/marketplace" })}
            className="flex items-center gap-2 rounded bg-[#0B2177] px-4 py-2 text-white text-xs font-semibold shadow-sm"
          >
            Go to Market Place
            <img src={marketplaceIcon} alt="Marketplace" className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">@{user?.firstName}</span>
            <NotificationsBell userId={userId} />
          </div>

          <button
            onClick={handleLogout}
            className="rounded flex items-center bg-[#222323] px-3 py-2 text-[11px] text-black"
          >
            Logout
            <img src={logoutIcon} alt="Marketplace" className="w-2 h-2" />
          </button>
        </div>
      </header>
      <section className="max-w-sm mx-auto">
        <div className="rounded-2xl bg-gradient-to-br from-[#CFEFFF] to-[#B9C7FF] p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/fundwallet" })}
              className="flex items-center gap-2 font-medium text-slate-900"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Plus className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
              Get Coins
            </button>

            <button className="bg-[#0B2177] text-white px-6 py-2 rounded-full text-sm">
              Transfer
            </button>
          </div>

          {/* Wallet Cards */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {wallets.map((wallet) => (
              <div key={wallet.title} className="rounded bg-white p-4 backdrop-blur-sm">
                <p className="text-[12px] font-extrabold tracking-wide text-[#0B2177]">
                  {wallet.title}
                </p>

                <p className="flex items-center gap-2 mt-2 tracking-wide text-sm font-medium text-slate-900">
                  <img src={coinIcon} alt={wallet.title} className="w-4 h-4" />
                  {formatCoins(wallet.balance)}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-xs font-semibold text-[#0B2177]">Your Referral Code</p>

              <div className="flex items-center gap-2 pt-1">
                <span className="font-bold text-[12px] text-[#0B2177]">
                  {" "}
                  {referralCode || "Loading..."}
                </span>
                <button onClick={handleCopyReferral}>
                  {" "}
                  <img src={copyIcon} alt="" className="w-3 h-3" />
                </button>
                <button onClick={handleShareReferral}>
                  {" "}
                  <img src={shareIcon} alt="" className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-[#0B2177] font-semibold text-sm">
                Total Referrals: {referrals.totalReferrals}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-sm mx-auto space-y-5">
        <div>
          <h3 className="text-foreground pl-4 text-sm font-semibold mt-4 mb-2">Available Games</h3>
          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  navigate({
                    to: "/game-lobby",
                    search: {
                      gameId: g.id,
                      gameName: g.name,
                    },
                  });
                }}
                className={`h-32 rounded-2xl bg-gradient-to-br ${g.bg} p-3 flex flex-col justify-between relative overflow-hidden cursor-pointer`}
              >
                {g.icons ? (
                  <div className="absolute top-2 right-2 flex gap-3">
                    {g.icons.map((icon, index) => (
                      <img
                        key={index}
                        src={icon}
                        alt={`${g.name}-${index}`}
                        className={`w-18 h-18 object-contain ${index !== 0 ? "-ml-10" : ""}`}
                      />
                    ))}
                  </div>
                ) : (
                  <img
                    src={g.icon}
                    alt={g.name}
                    className="w-18 h-18 absolute top-2 right-2 object-contain"
                  />
                )}

                <div className="mt-auto">
                  <p className="text-white font-bold text-lg leading-6 tracking-wide">{g.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <section className="bg-secondary rounded-2xl p-5">
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
        </section> */}

        {/* <section className="bg-secondary rounded-2xl p-5">
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
        </section> */}

        {/* <section className="rounded bg-secondary p-5">
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
        </section> */}

        <section className="rounded bg-[#111] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[#FFFFFF] font-semibold">Coin Transactions</h3>

            {historyLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="mt-4 space-y-3">
            {transactions.length ? (
              <>
                {displayedTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#FFFFFF]">
                        {transaction.packageName ||
                          transaction.description ||
                          transaction.type.replace(/_/g, " ")}
                      </p>

                      <p className="mt-1 font-semibold text-xs text-[#FFFFFF]">
                        {new Date(transaction.createdAt).toLocaleDateString()} -{" "}
                        {transaction.status}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-[#FFFFFF]">
                      {formatCoins(transaction.coins ?? transaction.amount ?? 0)}
                    </p>
                  </div>
                ))}

                {transactions.length > 4 && (
                  <button
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                    className="mt-3 text-sm font-medium py-1 px-4 bg-[#222323] rounded text-white hover:underline"
                  >
                    {showAllTransactions ? "Show Less" : "View All"}
                  </button>
                )}
              </>
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
