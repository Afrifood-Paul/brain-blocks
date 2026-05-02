const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "brain_token";

const canUseLocalStorage = () =>
  typeof window !== "undefined" &&
  typeof window.localStorage !== "undefined";

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
    const headers: Record<string, string> = {
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
      const error = new Error(data?.msg || "Request failed");
      (error as any).status = res.status; // <-- THIS FIXES YOUR 400/409/404 handling
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
  }) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
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

  logout() {
    this.setToken(null);
  }
}

export const apiClient = new ApiClient();
