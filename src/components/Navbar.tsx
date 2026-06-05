import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { NAV_LINKS } from "../data";
import { useNavigate } from "@tanstack/react-router";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [active, setActive] = useState<string>("Home");
    const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <span className="text-lg font-black leading-none text-white">K</span>
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">KIMO</span>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link: string) => (
            <button
              key={link}
              onClick={() => setActive(link)}
              className={`
                text-sm pb-0.5 border-b-2 cursor-pointer bg-transparent transition-all duration-150
                ${
                  active === link
                    ? "font-bold text-indigo-600 border-indigo-600"
                    : "font-medium text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300"
                }
              `}
            >
              {link}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button   onClick={() => navigate({ to: "/login" })} className="hidden rounded-lg border border-indigo-500 bg-transparent px-4 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 sm:inline-flex">
            Log in
          </button>

          <button   onClick={() => navigate({ to: "/register" })}  className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
            Register
          </button>

          <button
            onClick={onCartClick}
            className="relative ml-1 bg-transparent p-1.5 text-gray-500 transition-colors hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-6 w-6" aria-hidden="true" />

            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
