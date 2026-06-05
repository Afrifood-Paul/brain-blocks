import type { User } from "@/context/AuthContext";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "brain_token";

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

type ApiError = Error & { status?: number };
type Provider = "paystack" | "opay";
type VtuNetwork = "MTN" | "Airtel" | "Glo" | "9mobile";
type PackageType = "airtime" | "data";

type AuthResponse = {
  token?: string;
  user: User;
};

type WalletResponse = {
  activeCoins?: number;
  inactiveCoins?: number;
  coins?: number;
  balance?: number;
  authorizationUrl?: string;
  reference?: string;
  provider?: Provider;
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

type VtuPackage = {
  _id: string;
  network: VtuNetwork;
  type: PackageType;
  name: string;
  priceCoins: number;
  dataSize?: string;
  active: boolean;
};

type MarketplaceProduct = {
  id: string;
  name: string;
  category: string;
  coins: number;
  description: string;
  image: string;
};

type ReferralSummary = {
  referralCode: string;
  totalReferrals: number;
  totalReferralCoinsEarned: number;
};

type GameCreationResponse = WalletResponse & {
  gameId?: string;
  roomId?: string;
  inviteLink: string;
};

type LudoColor = "red" | "green" | "yellow" | "blue";

type LudoPlayer = {
  userId: string;
  username: string;
  name?: string;
  avatar?: string;
  color: LudoColor;
  online: boolean;
};

type LudoToken = {
  id: number;
  progress: number;
};

type LudoRoomSummary = {
  roomId: string;
  betAmount: number;
  pot: number;
  maxPlayers: number;
  minPlayers: number;
  turnSeconds: number;
  status: "waiting" | "countdown" | "active" | "finished" | "cancelled";
  players: LudoPlayer[];
  board?: Partial<Record<LudoColor, LudoToken[]>>;
  currentTurn?: LudoColor | null;
  lastDice?: number | null;
  mustMove?: boolean;
  turnDeadlineAt?: string | null;
  countdownEndsAt?: string | null;
  winnerColor?: LudoColor | null;
  winnerUserId?: string | null;
  result?: {
    pot?: number;
    payout?: number;
    platformFee?: number;
  };
  playerColor?: LudoColor | null;
  createdAt: string;
};

class ApiClient {
  private token: string | null = canUseLocalStorage()
    ? window.localStorage.getItem(TOKEN_KEY)
    : null;

  setToken(token: string | null) {
    this.token = token;

    if (!canUseLocalStorage()) return;

    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken() {
    return this.token;
  }

  async request<TResponse = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<TResponse> {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers: Record<string, string> = isFormData
      ? {}
      : {
          "Content-Type": "application/json",
        };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const errorMessage =
        data && typeof data === "object" && "msg" in data && typeof data.msg === "string"
          ? data.msg
          : "Request failed";
      const error: ApiError = new Error(errorMessage);
      error.status = res.status;
      throw error;
    }

    return data as TResponse;
  }

  async register(data: {
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
  }) {
    const body = new FormData();
    body.append("firstName", data.firstName);
    body.append("lastName", data.lastName);
    body.append("email", data.email);
    body.append("password", data.password);

    if (data.username) body.append("username", data.username);
    if (data.dob) body.append("dob", data.dob);
    if (data.phone) body.append("phone", data.phone);
    if (data.state) body.append("state", data.state);
    if (data.referralCode) body.append("referralCode", data.referralCode);
    if (data.avatar) body.append("avatar", data.avatar);

    const res = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body,
    });

    if (res?.token) {
      this.setToken(res.token);
    }

    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res?.token) {
      this.setToken(res.token);
    }

    return res;
  }

  async getMe() {
    return this.request<{ success: boolean; user: User }>("/auth/me");
  }

  async createGame(data: {
    gameType: string;
    amount: string;
    duration: string;
    directChallenge: boolean;
    opponentUsername?: string;
  }) {
    return this.request<GameCreationResponse>("/game/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLudoRooms() {
    return this.request<{ rooms: LudoRoomSummary[] }>("/ludo/rooms");
  }

  async getLudoRoom(roomId: string) {
    return this.request<{ room: LudoRoomSummary }>(`/ludo/rooms/${roomId}`);
  }

  async createLudoRoom(data: { betAmount: number; maxPlayers: number; turnSeconds: number }) {
    return this.request<GameCreationResponse>("/ludo/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLudoHistory() {
    return this.request<{ matches: LudoRoomSummary[] }>("/ludo/history");
  }

  async getWalletBalance() {
    return this.request<WalletResponse>("/wallet/balance");
  }

  async getWalletTransactions() {
    return this.request<{ transactions: CoinTransaction[] }>("/wallet/transactions");
  }

  async getReferralSummary() {
    return this.request<ReferralSummary>("/wallet/referrals");
  }

  async initializeWalletFunding(data: { provider: Provider; amount: number; callbackUrl: string }) {
    return this.request<WalletResponse>("/wallet/fund", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyWalletFunding(data: { provider: Provider; reference: string }) {
    return this.request<WalletResponse>("/wallet/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async transferCoins(data: { recipient: string; amount: number }) {
    return this.request<WalletResponse>("/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPackages(params: { network?: string; type?: string } = {}) {
    const query = new URLSearchParams();
    if (params.network) query.set("network", params.network);
    if (params.type) query.set("type", params.type);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request<{ packages: VtuPackage[] }>(`/packages${suffix}`);
  }

  async purchasePackage(packageId: string, userId?: string, phoneNumber?: string) {
    return this.request<WalletResponse>("/purchase", {
      method: "POST",
      body: JSON.stringify({ packageId, userId, phoneNumber }),
    });
  }

  async getMarketplaceProducts(params: { category?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== "All") {
      query.set("category", params.category);
    }
    if (params.search) {
      query.set("search", params.search);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request<{ products: MarketplaceProduct[]; categories: string[] }>(
      `/marketplace/products${suffix}`,
    );
  }

  async getMarketplaceProduct(productId: string) {
    return this.request<{ product: MarketplaceProduct }>(`/marketplace/products/${productId}`);
  }

  async purchaseMarketplaceProduct(productId: string, deliveryNote?: string) {
    return this.request<WalletResponse>("/marketplace/purchase", {
      method: "POST",
      body: JSON.stringify({ productId, deliveryNote }),
    });
  }

  logout() {
    this.setToken(null);
  }
}

export const apiClient = new ApiClient();
