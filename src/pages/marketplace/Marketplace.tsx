import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageCheck,
  Search,
  Smartphone,
  Wifi,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { formatCoins, useWallet } from "@/context/WalletContext";
import { apiClient } from "@/services/api";
import headsetImg from "../../assets/headset.jpg"

type VtuNetwork = "MTN" | "Airtel" | "Glo" | "9mobile";
type PackageType = "airtime" | "data";

type VtuPackage = {
  _id: string;
  network: VtuNetwork;
  type: PackageType;
  name: string;
  priceCoins: number;
  dataSize?: string;
};

type MarketplaceProduct = {
  id: string;
  name: string;
  category: string;
  coins: number;
  description: string;
  image: string;
};

type CoinTransaction = {
  _id: string;
  type: string;
  coins?: number;
  amount?: number;
  status: string;
  description: string;
  packageName?: string;
  createdAt: string;
};

const networks: VtuNetwork[] = ["MTN", "Airtel", "Glo", "9mobile"];
const packageTypes: { label: string; value: PackageType; icon: typeof Smartphone }[] = [
  { label: "Airtime", value: "airtime", icon: Smartphone },
  { label: "Data", value: "data", icon: Wifi },
];

const networkStyles: Record<VtuNetwork, string> = {
  MTN: "bg-yellow-300 text-black",
  Airtel: "bg-red-500 text-white",
  Glo: "bg-emerald-500 text-white",
  "9mobile": "bg-lime-500 text-black",
};

const normalizePhone = (phone: string) => phone.replace(/\s+/g, "");

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const Marketplace = () => {
  const navigate = useNavigate();
  const { coins, setLocalCoins, fetchBalance } = useWallet();
  const [packages, setPackages] = useState<VtuPackage[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [activeNetwork, setActiveNetwork] = useState<VtuNetwork>("MTN");
  const [activeType, setActiveType] = useState<PackageType>("airtime");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [search, setSearch] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const visiblePackages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return packages.filter((item) => {
      const matchesSelection = item.network === activeNetwork && item.type === activeType;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.dataSize?.toLowerCase().includes(query);

      return matchesSelection && matchesSearch;
    });
  }, [activeNetwork, activeType, packages, search]);

  const gadgetProducts = useMemo(
    () => products.filter((product) => product.category === "Tech Gadgets"),
    [products],
  );

  const purchaseHistory = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.type === "marketplace_purchase" || transaction.type === "coin_purchase",
      ),
    [transactions],
  );

  const loadMarketplace = useCallback(async () => {
    setLoading(true);

    try {
      const [packagesRes, productsRes, transactionsRes] = await Promise.all([
        apiClient.getPackages(),
        apiClient.getMarketplaceProducts({ category: "Tech Gadgets" }),
        apiClient.getWalletTransactions(),
      ]);

      setPackages(packagesRes.packages || []);
      setProducts(productsRes.products || []);
      setTransactions(transactionsRes.transactions || []);
      await fetchBalance();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Unable to load marketplace"));
    } finally {
      setLoading(false);
    }
  }, [fetchBalance]);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  const refreshHistory = async () => {
    const [balanceRes, transactionsRes] = await Promise.all([
      apiClient.getWalletBalance(),
      apiClient.getWalletTransactions(),
    ]);

    setLocalCoins(Number(balanceRes.coins ?? balanceRes.balance ?? 0));
    setTransactions(transactionsRes.transactions || []);
  };

  const buyPackage = async (selectedPackage: VtuPackage) => {
    const normalizedPhone = normalizePhone(phoneNumber);

    if (!/^0\d{10}$/.test(normalizedPhone)) {
      toast.error("Enter a valid 11-digit phone number");
      return;
    }

    if (coins < selectedPackage.priceCoins) {
      toast.error("Insufficient coins");
      return;
    }

    const confirmed = window.confirm(
      `Buy ${selectedPackage.name} for ${formatCoins(selectedPackage.priceCoins)}?`,
    );
    if (!confirmed) return;

    setBuyingId(selectedPackage._id);

    try {
      const res = await apiClient.purchasePackage(selectedPackage._id, undefined, normalizedPhone);
      setLocalCoins(Number(res.coins ?? res.balance ?? 0));
      await refreshHistory();
      toast.success(`${selectedPackage.name} purchase successful`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Purchase failed"));
    } finally {
      setBuyingId(null);
    }
  };

  const buyProduct = async (product: MarketplaceProduct) => {
    if (coins < product.coins) {
      toast.error("Insufficient coins");
      return;
    }

    const confirmed = window.confirm(`Redeem ${product.name} for ${formatCoins(product.coins)}?`);
    if (!confirmed) return;

    setBuyingId(product.id);

    try {
      const res = await apiClient.purchaseMarketplaceProduct(product.id, deliveryNote);
      setLocalCoins(Number(res.coins ?? res.balance ?? 0));
      await refreshHistory();
      toast.success(`${product.name} redeemed`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Redemption failed"));
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground">
      <div className="mx-auto max-w-md space-y-5">
        <header className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Coin Balance</p>
            <p className="text-lg font-bold">{formatCoins(coins)}</p>
          </div>
        </header>

        <section className="rounded bg-secondary p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Marketplace</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Airtime, data, and tech rewards paid with coins.
              </p>
            </div>
            <PackageCheck className="h-6 w-6 text-emerald-300" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Airtime & Data</h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            inputMode="tel"
            placeholder="Recipient phone number"
            className="h-12 w-full rounded-full bg-white px-5 text-sm text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bundles"
              className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {networks.map((network) => (
              <button
                key={network}
                onClick={() => setActiveNetwork(network)}
                className={`h-11 rounded text-xs font-bold transition ${
                  activeNetwork === network
                    ? networkStyles[network]
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {network}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-full bg-secondary p-1">
            {packageTypes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveType(item.value)}
                  className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeType === item.value ? "bg-primary text-white" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {visiblePackages.length ? (
            <div className="grid grid-cols-2 gap-3">
              {visiblePackages.map((item) => (
                <article key={item._id} className="rounded bg-secondary p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-bold ${networkStyles[item.network]}`}
                    >
                      {item.network}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground">{item.type}</span>
                  </div>
                  <h3 className="mt-3 min-h-10 text-sm font-semibold">{item.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.dataSize || "Instant top-up"}
                  </p>
                  <p className="mt-3 text-sm font-bold">{formatCoins(item.priceCoins)}</p>
                  <button
                    onClick={() => buyPackage(item)}
                    disabled={buyingId === item._id}
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {buyingId === item._id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Buy
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded bg-secondary p-5 text-center text-sm text-muted-foreground">
              {loading ? "Loading packages..." : "No package found for this selection."}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold">Tech Gadgets</h2>
          <textarea
            value={deliveryNote}
            onChange={(event) => setDeliveryNote(event.target.value)}
            placeholder="Delivery note or contact detail"
            className="min-h-20 w-full rounded bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
          />

          <div className="grid grid-cols-2 gap-3">
            {gadgetProducts.map((product) => (
              <article key={product.id} className="rounded bg-secondary p-3">
                <h3 className="text-sm font-semibold">{product.name}</h3>
                <p className="mt-2 min-h-10 text-xs text-muted-foreground">{product.description}</p>
                <p className="mt-3 text-sm font-bold">{formatCoins(product.coins)}</p>
                <button
                  onClick={() => buyProduct(product)}
                  disabled={buyingId === product.id}
                  className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-white px-3 text-xs font-semibold text-black disabled:opacity-60"
                >
                  {buyingId === product.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Redeem
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded bg-secondary p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Purchase History</h2>
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="mt-4 space-y-3">
            {purchaseHistory.length ? (
              purchaseHistory.slice(0, 8).map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.packageName || transaction.description}
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
                No marketplace purchases yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Marketplace;
