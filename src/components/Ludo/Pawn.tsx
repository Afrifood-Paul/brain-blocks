type PawnColor = "red" | "green" | "yellow" | "blue";

interface PawnProps {
  color: PawnColor;
  // grid position 1-15 for column/row
  col: number;
  row: number;
}

const colorMap: Record<PawnColor, string> = {
  red: "bg-red-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  blue: "bg-blue-500",
};

export function Pawn({ color, col, row }: PawnProps) {
  // each cell is 1/15 of the board
  const leftPct = ((col - 0.5) / 15) * 100;
  const topPct = ((row - 0.5) / 15) * 100;
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ left: `${leftPct}%`, top: `${topPct}%`, width: `${100 / 15}%`, aspectRatio: "1" }}
    >
      <div className="w-full h-full p-[15%]">
        <div
          className={`w-full h-full rounded-full ${colorMap[color]} border-2 border-white shadow-md ring-1 ring-black/20`}
        />
      </div>
    </div>
  );
}

export type { PawnColor };
