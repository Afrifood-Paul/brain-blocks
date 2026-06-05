import { JSX } from "react";
import { Dices, Gamepad2 } from "lucide-react";

export default function Hero(): JSX.Element {
  const stats: [string, string][] = [
    ["50K+", "Active Players"],
    ["5", "Games Available"],
    ["₦10M+", "Prizes Won"],
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 px-4 py-20 sm:px-6">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 md:flex-row">
        <div className="flex-1">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-4 py-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-300" />
            <span className="text-xs font-semibold text-indigo-300">
              No personal money involved — Just Play & Win
            </span>
          </div>

          <h1 className="mb-5 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            Get rewarded playing
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              your favourite Games!
            </span>
          </h1>

          <p className="mb-8 max-w-md text-sm leading-relaxed text-gray-400">
            Join KIMO — Africa&apos;s premier gaming rewards platform. Play games you love, climb
            leaderboards, and earn real cash prizes with zero deposit required.
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-opacity hover:opacity-90">
              <Gamepad2 className="h-4 w-4" aria-hidden="true" />
              Play Now
            </button>

            <button className="rounded-xl border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-indigo-100 transition-colors hover:bg-white/15">
              Fund Wallet
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-10">
            {stats.map(([value, label]) => (
              <div key={label}>
                <p className="text-2xl font-black text-indigo-300">{value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 justify-end">
          <div className="relative w-full max-w-80">
            <div className="overflow-hidden rounded-2xl border-2 border-violet-500/30 shadow-2xl shadow-indigo-500/20">
              <img
                src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=640&h=440&fit=crop"
                alt="Gaming"
                className="block w-full brightness-75 saturate-150"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-indigo-950/80 to-transparent" />
            </div>

            <div className="absolute -bottom-4 -left-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-5">
              <Dices className="h-8 w-8 text-indigo-600" aria-hidden="true" />
              <div>
                <p className="text-[10px] text-gray-400">Most Played</p>
                <p className="text-sm font-black text-gray-900">Ludo Classic</p>
              </div>
            </div>

            <div className="absolute -right-2 -top-3 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 shadow-lg shadow-violet-500/40 sm:-right-4">
              <p className="text-[10px] text-white/70">Top Prize</p>
              <p className="text-lg font-black text-white">₦50,000</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
