import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthTabs } from "@/components/AuthTabs";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-background text-foreground px-4 pt-10 pb-16">
      <div className="mx-auto w-full max-w-md">
        <AuthTabs active="register" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
          className="mt-16 space-y-5"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-14 rounded-full bg-white text-black placeholder:text-neutral-400 px-6 outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
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
            type="submit"
            className="w-full h-14 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:opacity-95 transition-opacity mt-2"
          >
            Register
          </button>
        </form>
      </div>
    </main>
  );
}
