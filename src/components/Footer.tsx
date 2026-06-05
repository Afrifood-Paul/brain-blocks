import { JSX } from "react";
import { FOOTER_COLS } from "../data";

export default function Footer(): JSX.Element {
  return (
    <footer className="bg-indigo-950 px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <span className="text-white font-black text-lg leading-none">K</span>
              </div>
              <span className="font-black text-xl text-white">KIMO</span>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed max-w-[200px] mb-5">
              Africa's free-to-play gaming rewards platform. No deposit required — just play and
              win.
            </p>

            <div className="flex gap-2">
              {["𝕏", "f", "in", "▶"].map((icon: string) => (
                <button
                  key={icon}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs cursor-pointer hover:bg-white/10 transition-colors"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((column: { title: string; links: string[] }) => (
            <div key={column.title}>
              <h4 className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest mb-4">
                {column.title}
              </h4>

              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {column.links.map((link: string) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 no-underline hover:text-indigo-300 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
          <p className="text-xs text-gray-600">© 2024 KIMO Games. All rights reserved.</p>

          <p className="text-xs text-gray-600">Made with ❤️ in Africa</p>
        </div>
      </div>
    </footer>
  );
}
