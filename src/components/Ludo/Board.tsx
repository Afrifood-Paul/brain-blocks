import { Cell } from "./Cell";
import { Pawn, type PawnColor } from "./Pawn";

// Colors
const RED = "bg-red-500";
const GREEN = "bg-green-500";
const YELLOW = "bg-yellow-400";
const BLUE = "bg-blue-500";
const WHITE = "bg-white";

// Safe cell positions (1-indexed col,row) — classic ludo safe spots
const SAFE: Array<[number, number]> = [
  [2, 7], [7, 2], [9, 3], [14, 7],
  [13, 9], [9, 14], [7, 13], [3, 9],
  // starting cells
  [2, 9], [7, 3], [14, 9], [9, 13],
];

function isSafe(c: number, r: number) {
  return SAFE.some(([sc, sr]) => sc === c && sr === r);
}

// Determine cell appearance
function cellInfo(c: number, r: number): { bg: string; safe: boolean } {
  // Home zones (6x6 corners)
  if (c <= 6 && r <= 6) return { bg: YELLOW, safe: false };
  if (c >= 10 && r <= 6) return { bg: BLUE, safe: false };
  if (c <= 6 && r >= 10) return { bg: GREEN, safe: false };
  if (c >= 10 && r >= 10) return { bg: RED, safe: false };

  // Center 3x3 (cols 7-9, rows 7-9) handled separately
  if (c >= 7 && c <= 9 && r >= 7 && r <= 9) return { bg: "", safe: false };

  // Home paths (colored runways toward center)
  // Yellow path: row 8, cols 2..6 leading to center
  if (r === 8 && c >= 2 && c <= 6) return { bg: YELLOW, safe: false };
  // Blue path: col 8, rows 2..6
  if (c === 8 && r >= 2 && r <= 6) return { bg: BLUE, safe: false };
  // Red path: row 8, cols 10..14
  if (r === 8 && c >= 10 && c <= 14) return { bg: RED, safe: false };
  // Green path: col 8, rows 10..14
  if (c === 8 && r >= 10 && r <= 14) return { bg: GREEN, safe: false };

  // Track cells (the cross arms)
  return { bg: WHITE, safe: isSafe(c, r) };
}

// Star icon for safe cells
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 text-neutral-500" fill="currentColor">
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1L12 2z" />
    </svg>
  );
}

// Colored arrow indicating starting cell (simple chevron triangle)
function StartArrow({ color }: { color: PawnColor }) {
  const colorClass = {
    red: "bg-[hsl(0,85%,55%)]",
    green: "bg-[hsl(140,70%,40%)]",
    yellow: "bg-[hsl(48,100%,55%)]",
    blue: "bg-[hsl(215,85%,55%)]",
  }[color];
  return <div className={`w-1/2 h-1/2 ${colorClass} rounded-sm rotate-45`} />;
}

// Home zone with 4 pawn slots
function HomeZone({
  colStart,
  rowStart,
  bg,
  ringColor,
}: {
  colStart: number;
  rowStart: number;
  bg: string;
  ringColor: string;
}) {
  // Inner white panel with 4 circles
  return (
    <div
      className={`${bg} relative z-0`}
      style={{
        gridColumn: `${colStart} / span 6`,
        gridRow: `${rowStart} / span 6`,
      }}
    >
      <div className="absolute inset-[16%] bg-white rounded-sm grid grid-cols-2 grid-rows-2 gap-[10%] p-[10%]">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`rounded-full ${ringColor} flex items-center justify-center`}
          />
        ))}
      </div>
    </div>
  );
}

interface BoardProps {
  pawns?: Array<{ color: PawnColor; col: number; row: number }>;
}

// Default pawns sitting in home circles
const defaultPawns: NonNullable<BoardProps["pawns"]> = [
  // Yellow (top-left) — circles roughly at cols 2.5,4.5 rows 2.5,4.5
  { color: "yellow", col: 2.5, row: 2.5 },
  { color: "yellow", col: 4.5, row: 2.5 },
  { color: "yellow", col: 2.5, row: 4.5 },
  { color: "yellow", col: 4.5, row: 4.5 },
  // Blue (top-right) cols 11.5,13.5
  { color: "blue", col: 11.5, row: 2.5 },
  { color: "blue", col: 13.5, row: 2.5 },
  { color: "blue", col: 11.5, row: 4.5 },
  { color: "blue", col: 13.5, row: 4.5 },
  // Green (bottom-left)
  { color: "green", col: 2.5, row: 11.5 },
  { color: "green", col: 4.5, row: 11.5 },
  { color: "green", col: 2.5, row: 13.5 },
  { color: "green", col: 4.5, row: 13.5 },
  // Red (bottom-right)
  { color: "red", col: 11.5, row: 11.5 },
  { color: "red", col: 13.5, row: 11.5 },
  { color: "red", col: 11.5, row: 13.5 },
  { color: "red", col: 13.5, row: 13.5 },
];

export function Board({ pawns = defaultPawns }: BoardProps) {
  const cells: React.ReactNode[] = [];

  for (let r = 1; r <= 15; r++) {
    for (let c = 1; c <= 15; c++) {
      // Skip cells inside home zones (rendered as one big panel)
      const inYellow = c <= 6 && r <= 6;
      const inBlue = c >= 10 && r <= 6;
      const inGreen = c <= 6 && r >= 10;
      const inRed = c >= 10 && r >= 10;
      if (inYellow || inBlue || inGreen || inRed) continue;

      // Skip center 3x3
      if (c >= 7 && c <= 9 && r >= 7 && r <= 9) continue;

      const { bg, safe } = cellInfo(c, r);

      // Starting cell arrows
      let content: React.ReactNode = null;
      if (c === 2 && r === 7) content = <StartArrow color="yellow" />;
      else if (c === 9 && r === 2) content = <StartArrow color="blue" />;
      else if (c === 14 && r === 9) content = <StartArrow color="red" />;
      else if (c === 7 && r === 14) content = <StartArrow color="green" />;
      else if (safe) content = <StarIcon />;

      cells.push(
        <Cell
          key={`${c}-${r}`}
          col={c}
          row={r}
          className={`${bg} flex items-center justify-center`}
        >
          {content}
        </Cell>,
      );
    }
  }

  return (
    <div className=" w-full max-w-[640px] aspect-square bg-neutral-800 p-1 rounded-lg shadow-2xl relative">
      <div
        className="grid w-full h-full relative bg-white z-0"
        style={{
          gridTemplateColumns: "repeat(15, 1fr)",
          gridTemplateRows: "repeat(15, 1fr)",
        }}
      >
        {/* Home zones */}
        <HomeZone colStart={1} rowStart={1} bg={YELLOW} ringColor={YELLOW} />
        <HomeZone colStart={10} rowStart={1} bg={BLUE} ringColor={BLUE} />
        <HomeZone colStart={1} rowStart={10} bg={GREEN} ringColor={GREEN} />
        <HomeZone colStart={10} rowStart={10} bg={RED} ringColor={RED} />

        {/* Track + path cells */}
        {cells}

        {/* Center diamond (3x3) */}
        <div
          className="relative"
          style={{ gridColumn: "7 / span 3", gridRow: "7 / span 3" }}
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Top - Blue */}
            <polygon points="0,0 100,0 50,50" fill="hsl(215,85%,55%)" />
            {/* Right - Red */}
            <polygon points="100,0 100,100 50,50" fill="hsl(0,85%,55%)" />
            {/* Bottom - Green */}
            <polygon points="100,100 0,100 50,50" fill="hsl(140,70%,40%)" />
            {/* Left - Yellow */}
            <polygon points="0,100 0,0 50,50" fill="hsl(48,100%,55%)" />
          </svg>
        </div>

        {/* Pawns layer */}
        <div className="absolute inset-0 z-[100] pointer-events-none">
          {pawns.map((p, i) => (
            <Pawn key={i} color={p.color} col={p.col} row={p.row} />
          ))}
        </div>
      </div>
    </div>
  );
}
