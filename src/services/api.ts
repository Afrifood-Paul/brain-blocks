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

export type SessionStatus = "pending" | "accepted" | "active" | "completed" | "declined";
export type InviteStatus = SessionStatus;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Invite = {
  _id: string;
  sessionId?: string;
  gameId: string;
  gameName: string;
  amount: number;
  inviterId: string;
  invitedUserId?: string;
  invitedUsername: string;
  status: InviteStatus;
  inviteLink: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  inviter?: SessionPlayer;
  invitedUser?: SessionPlayer;
  players?: SessionPlayer[];
};

export type SessionPlayer = {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  lastActive?: string;
};

export type Session = Invite & {
  sessionId: string;
  players: SessionPlayer[];
};

export type AppNotification = {
  _id: string;
  userId: string;
  type: "invite";
  title: string;
  message: string;
  inviteId?: string;
  read: boolean;
  createdAt: string;
  invite?: Invite;
};

export type OnlineUser = {
  _id: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastActive?: string;
  currentGameId?: string | null;
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
  private sessionCache = new Map<string, Promise<unknown>>();

  setToken(token: string | null) {
    if (this.token !== token) {
      this.sessionCache.clear();
    }

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

  private clearCache(prefix?: string) {
    if (!prefix) {
      this.sessionCache.clear();
      return;
    }

    Array.from(this.sessionCache.keys()).forEach((key) => {
      if (key.startsWith(prefix)) {
        this.sessionCache.delete(key);
      }
    });
  }

  private cachedRequest<TResponse>(endpoint: string, force = false) {
    const cacheKey = `${this.token || "public"}:${endpoint}`;

    if (force) {
      this.sessionCache.delete(cacheKey);
    }

    if (!this.sessionCache.has(cacheKey)) {
      this.sessionCache.set(
        cacheKey,
        this.request<TResponse>(endpoint).catch((error) => {
          this.sessionCache.delete(cacheKey);
          throw error;
        }),
      );
    }

    return this.sessionCache.get(cacheKey) as Promise<TResponse>;
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
    return this.cachedRequest<WalletResponse>("/wallet/balance");
  }

  async getWalletTransactions(force = false) {
    return this.cachedRequest<{ transactions: CoinTransaction[] }>("/wallet/transactions", force);
  }

  async getReferralSummary(force = false) {
    return this.cachedRequest<ReferralSummary>("/wallet/referrals", force);
  }

  async initializeWalletFunding(data: { provider: Provider; amount: number; callbackUrl: string }) {
    return this.request<WalletResponse>("/wallet/fund", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyWalletFunding(data: { provider: Provider; reference: string }) {
    const res = await this.request<WalletResponse>("/wallet/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.clearCache(`${this.token || "public"}:/wallet`);
    return res;
  }

  async transferCoins(data: { recipient: string; amount: number }) {
    const res = await this.request<WalletResponse>("/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.clearCache(`${this.token || "public"}:/wallet`);
    return res;
  }

  async getPackages(params: { network?: string; type?: string } = {}, force = false) {
    const query = new URLSearchParams();
    if (params.network) query.set("network", params.network);
    if (params.type) query.set("type", params.type);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.cachedRequest<{ packages: VtuPackage[] }>(`/packages${suffix}`, force);
  }

  async purchasePackage(packageId: string, userId?: string, phoneNumber?: string) {
    const res = await this.request<WalletResponse>("/purchase", {
      method: "POST",
      body: JSON.stringify({ packageId, userId, phoneNumber }),
    });
    this.clearCache(`${this.token || "public"}:/wallet`);
    return res;
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
    const res = await this.request<WalletResponse>("/marketplace/purchase", {
      method: "POST",
      body: JSON.stringify({ productId, deliveryNote }),
    });
    this.clearCache(`${this.token || "public"}:/wallet`);
    return res;
  }

  async createInvite(data: {
    gameId: string;
    gameName: string;
    amount: number;
    invitedUsername: string;
  }) {
    const res = await this.request<{ invite: Invite }>("/invites", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.clearCache(`${this.token || "public"}:/invites`);
    this.clearCache(`${this.token || "public"}:/notifications`);
    return res;
  }

  async getInvites(userId: string, force = false) {
    return this.cachedRequest<{ invites: Invite[] }>(`/invites/${userId}`, force);
  }

  async getSessions(
    params: { status?: SessionStatus | ""; gameId?: string; page?: number; limit?: number } = {},
    force = false,
  ) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.gameId) query.set("gameId", params.gameId);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.cachedRequest<{ sessions: Session[]; pagination: PaginationMeta }>(
      `/sessions${suffix}`,
      force,
    );
  }

  async getSession(sessionId: string, force = false) {
    return this.cachedRequest<{ session: Session }>(`/sessions/${sessionId}`, force);
  }

  async startSession(sessionId: string) {
    const res = await this.request<{ session: Session }>(`/sessions/${sessionId}/start`, {
      method: "PATCH",
    });
    this.clearCache(`${this.token || "public"}:/sessions`);
    this.clearCache(`${this.token || "public"}:/invites`);
    this.clearCache(`${this.token || "public"}:/notifications`);
    return res;
  }

  async deleteSession(sessionId: string) {
    const res = await this.request<{ success: boolean; sessionId: string }>(
      `/sessions/${sessionId}`,
      {
        method: "DELETE",
      },
    );
    this.clearCache(`${this.token || "public"}:/sessions`);
    this.clearCache(`${this.token || "public"}:/invites`);
    this.clearCache(`${this.token || "public"}:/notifications`);
    return res;
  }

  async acceptInvite(inviteId: string) {
    const res = await this.request<{ invite: Invite; session?: Session }>(
      `/invites/${inviteId}/accept`,
      {
        method: "PATCH",
      },
    );
    this.clearCache(`${this.token || "public"}:/invites`);
    this.clearCache(`${this.token || "public"}:/sessions`);
    this.clearCache(`${this.token || "public"}:/notifications`);
    return res;
  }

  async declineInvite(inviteId: string) {
    const res = await this.request<{ invite: Invite; session?: Session }>(
      `/invites/${inviteId}/decline`,
      {
        method: "PATCH",
      },
    );
    this.clearCache(`${this.token || "public"}:/invites`);
    this.clearCache(`${this.token || "public"}:/sessions`);
    this.clearCache(`${this.token || "public"}:/notifications`);
    return res;
  }

  async getNotifications(userId: string, force = false) {
    return this.cachedRequest<{ notifications: AppNotification[] }>(
      `/notifications/${userId}`,
      force,
    );
  }

  async markNotificationRead(notificationId: string) {
    const res = await this.request<{ notification: AppNotification }>(
      `/notifications/${notificationId}/read`,
      {
        method: "PATCH",
      },
    );
    this.clearCache(`${this.token || "public"}:/notifications`);
    return res;
  }

  async getOnlineUsers(
    params: { search?: string; gameId?: string; page?: number; limit?: number } = {},
    force = false,
  ) {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.gameId) query.set("gameId", params.gameId);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.cachedRequest<{ users: OnlineUser[]; pagination: PaginationMeta }>(
      `/users/online${suffix}`,
      force,
    );
  }

  async updatePresence(isOnline: boolean, currentGameId?: string | null) {
    return this.request<{ user: OnlineUser }>("/users/presence", {
      method: "POST",
      body: JSON.stringify({ isOnline, currentGameId }),
    });
  }

  sendPresenceBeacon(isOnline: boolean) {
    if (typeof navigator === "undefined" || !navigator.sendBeacon || !this.token) {
      return false;
    }

    const body = new Blob([JSON.stringify({ isOnline, token: this.token })], {
      type: "application/json",
    });

    return navigator.sendBeacon(`${API_BASE_URL}/users/presence/beacon`, body);
  }

  logout() {
    this.sendPresenceBeacon(false);
    this.setToken(null);
  }
}

export const apiClient = new ApiClient();
