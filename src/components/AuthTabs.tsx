import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function AuthTabs({ active }: { active: "login" | "register" }) {
  return (
    <div className="flex items-center justify-center gap-12">
      <Link
        to="/login"
        className={cn(
          "px-6 py-3 rounded-lg text-base font-semibold transition-colors",
          active === "login"
            ? "bg-[var(--tab-active)] text-foreground border border-primary/60"
            : "text-foreground/90",
        )}
      >
        Log in
      </Link>
      <Link
        to="/register"
        className={cn(
          "px-6 py-3 rounded-lg text-base font-semibold transition-colors",
          active === "register"
            ? "bg-[var(--tab-active)] text-foreground border border-primary/60"
            : "text-foreground/90",
        )}
      >
        Register
      </Link>
    </div>
  );
}
