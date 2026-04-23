import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function AuthTabs({ active }: { active: "login" | "register" }) {
  const tabs =
    active === "register"
      ? [
          { label: "Register", to: "/register", key: "register" },
          { label: "Log in", to: "/login", key: "login" },
        ]
      : [
          { label: "Log in", to: "/login", key: "login" },
          { label: "Register", to: "/register", key: "register" },
        ];

  return (
    <div className="flex items-center justify-between gap-12">
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            to={tab.to}
            className={cn(
              "px-6 py-3 text-base font-semibold transition-colors",
              isActive
                ? "bg-tab-active text-foreground border border-primary/60"
                : "text-foreground/90"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}