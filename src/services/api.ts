export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "brain_token";

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

type ApiError = Error & { status?: number };

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

  async request(endpoint: string, options: RequestInit = {}) {
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
      headers,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    // ✅ IMPORTANT FIX (this was your main issue)
    if (!res.ok) {
      const error: ApiError = new Error(data?.msg || "Request failed");
      error.status = res.status; // <-- THIS FIXES YOUR 400/409/404 handling
      throw error;
    }

    return data;
  }

  async register(data: {
    firstName: string;
    lastName: string;
    username?: string;
    email: string;
    password: string;
    dob?: string;
    phone?: string;
    state?: string;
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
    if (data.referralCode) body.append("referralCode", data.referralCode);
    if (data.avatar) body.append("avatar", data.avatar);

    const res = await this.request("/auth/register", {
      method: "POST",
      body,
    });

    if (res?.token) {
      this.setToken(res.token);
    }

    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res?.token) {
      this.setToken(res.token);
    }

    return res;
  }

  async getMe() {
    return this.request("/auth/me");
  }

  async createGame(data: {
    gameType: string;
    amount: string;
    duration: string;
    directChallenge: boolean;
    opponentUsername?: string;
  }) {
    return this.request("/game/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLudoRooms() {
    return this.request("/ludo/rooms");
  }

  async getLudoRoom(roomId: string) {
    return this.request(`/ludo/rooms/${roomId}`);
  }

  async createLudoRoom(data: { betAmount: number; maxPlayers: number; turnSeconds: number }) {
    return this.request("/ludo/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLudoHistory() {
    return this.request("/ludo/history");
  }

  async getWalletBalance() {
    return this.request("/wallet/balance");
  }

  async getWalletTransactions() {
    return this.request("/wallet/transactions");
  }

  async getReferralSummary() {
    return this.request("/wallet/referrals");
  }

  async initializeWalletFunding(data: {
    provider: "paystack" | "opay";
    amount: number;
    callbackUrl: string;
  }) {
    return this.request("/wallet/fund", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyWalletFunding(data: { provider: "paystack" | "opay"; reference: string }) {
    return this.request("/wallet/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async transferCoins(data: { recipient: string; amount: number }) {
    return this.request("/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPackages(params: { network?: string; type?: string } = {}) {
    const query = new URLSearchParams();
    if (params.network) query.set("network", params.network);
    if (params.type) query.set("type", params.type);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/packages${suffix}`);
  }

  async purchasePackage(packageId: string, userId?: string, phoneNumber?: string) {
    return this.request("/purchase", {
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
    return this.request(`/marketplace/products${suffix}`);
  }

  async getMarketplaceProduct(productId: string) {
    return this.request(`/marketplace/products/${productId}`);
  }

  async purchaseMarketplaceProduct(productId: string, deliveryNote?: string) {
    return this.request("/marketplace/purchase", {
      method: "POST",
      body: JSON.stringify({ productId, deliveryNote }),
    });
  }

  logout() {
    this.setToken(null);
  }
}

export const apiClient = new ApiClient();
