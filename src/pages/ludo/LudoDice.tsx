import { useEffect, useState } from "react";
import { Dice5 } from "lucide-react";

const pipPositions: Record<number, string[]> = {
  1: ["center"],
  2: ["top-left", "bottom-right"],
  3: ["top-left", "center", "bottom-right"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
};

const pipClass: Record<string, string> = {
  "top-left": "left-[22%] top-[22%]",
  "top-right": "right-[22%] top-[22%]",
  "middle-left": "left-[22%] top-1/2 -translate-y-1/2",
  "middle-right": "right-[22%] top-1/2 -translate-y-1/2",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-[22%] left-[22%]",
  "bottom-right": "bottom-[22%] right-[22%]",
};

type LudoDiceProps = {
  value?: number | null;
  rolling: boolean;
  disabled: boolean;
  onRoll: () => void;
};

export const LudoDice = ({ value, rolling, disabled, onRoll }: LudoDiceProps) => {
  const [face, setFace] = useState(value || 1);

  useEffect(() => {
    if (!rolling) {
      setFace(value || 1);
      return;
    }

    window.dispatchEvent(new CustomEvent("ludo:dice-roll", { detail: { rolling: true } }));
    const timer = window.setInterval(() => {
      setFace(Math.floor(Math.random() * 6) + 1);
    }, 90);

    return () => window.clearInterval(timer);
  }, [rolling, value]);

  useEffect(() => {
    if (!rolling && value) {
      setFace(value);
      window.dispatchEvent(new CustomEvent("ludo:dice-roll", { detail: { rolling: false, value } }));
    }
  }, [rolling, value]);

  return (
    <>
      <button
        type="button"
        onClick={onRoll}
        disabled={disabled}
        className={`mx-auto mt-4 block h-24 w-24 rounded-2xl border border-white/70 bg-gradient-to-br from-white via-slate-100 to-slate-300 p-3 shadow-[inset_-10px_-12px_20px_rgba(15,23,42,0.18),inset_8px_8px_16px_rgba(255,255,255,0.85),0_18px_35px_rgba(0,0,0,0.45)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
          rolling ? "ludo-dice-rolling" : "hover:-translate-y-1 active:translate-y-0"
        }`}
        aria-label="Roll dice"
      >
        <span className="relative block h-full w-full rounded-xl bg-white/80 shadow-inner">
          {value || rolling ? (
            pipPositions[face].map((position) => (
              <span
                key={position}
                className={`absolute h-3.5 w-3.5 rounded-full bg-slate-950 shadow ${pipClass[position]}`}
              />
            ))
          ) : (
            <span className="flex h-full items-center justify-center text-slate-950">
              <Dice5 className="h-11 w-11" />
            </span>
          )}
        </span>
      </button>

      <button
        onClick={onRoll}
        disabled={disabled}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {rolling ? "Rolling..." : "Roll Dice"}
      </button>
    </>
  );
};
