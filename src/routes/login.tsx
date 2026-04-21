import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthTabs } from "@/components/AuthTabs";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-background text-foreground px-4 pt-10 pb-16">
      <div className="mx-auto w-full max-w-md">
        <AuthTabs active="login" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
          className="mt-16 space-y-5"
        >
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or Username"
            className="w-full h-14 rounded-full bg-white text-black placeholder:text-neutral-400 px-6 outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-14 rounded-full bg-white text-black placeholder:text-neutral-400 px-6 outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="button"
            className="block text-sm font-semibold text-foreground/95 hover:text-foreground"
          >
            Forgotten Password?
          </button>

          <button
            type="submit"
            className="w-full h-14 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:opacity-95 transition-opacity"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
