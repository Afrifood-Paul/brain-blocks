import React, { useEffect, useState } from "react";
import { AuthTabs } from "@/components/AuthTabs";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { consumeAuthRedirect } from "@/services/authRedirect";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: consumeAuthRedirect() || "/dashboard", replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = identifier.trim();

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error("Login failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = loading || submitting;

  return (
    <main className="min-h-screen bg-background text-foreground px-4 pt-10 pb-16">
      <div className="mx-auto w-full max-w-md">
        <AuthTabs active="login" />

        <form onSubmit={handleLogin} className="mt-16 space-y-5">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            disabled={isBusy}
            className="w-full h-14 rounded-full bg-white text-black placeholder:text-neutral-400 px-6 outline-none focus:ring-2 focus:ring-primary"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            disabled={isBusy}
            className="w-full h-14 rounded-full bg-white text-black placeholder:text-neutral-400 px-6 outline-none focus:ring-2 focus:ring-primary"
          />

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            className="block lg:ml-6 text-sm font-semibold text-foreground/95 hover:text-foreground"
          >
            Forgotten Password?
          </button>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-14 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:opacity-95 transition-opacity"
          >
            {isBusy ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
