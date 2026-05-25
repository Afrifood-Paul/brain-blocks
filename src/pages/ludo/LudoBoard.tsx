import { memo, useMemo } from "react";
import {
  getTokenCoord,
  getTrailProgress,
  homeCoords,
  laneCoords,
  ludoColors,
  pathCoords,
  safeSquares,
  startOffsets,
  type LudoBoardState,
  type LudoColor,
} from "./ludoBoardUtils";

const paint: Record<LudoColor, { main: string; deep: string; soft: string }> = {
  red: { main: "#ef4444", deep: "#991b1b", soft: "#fee2e2" },
  green: { main: "#10b981", deep: "#047857", soft: "#d1fae5" },
  yellow: { main: "#facc15", deep: "#a16207", soft: "#fef3c7" },
  blue: { main: "#0ea5e9", deep: "#0369a1", soft: "#dbeafe" },
};

const tile = 40;
const center = (row: number, col: number) => ({
  x: col * tile + tile / 2,
  y: row * tile + tile / 2,
});

type LudoBoardProps = {
  board: LudoBoardState;
  playerColor: LudoColor | null;
  currentTurn?: LudoColor | null;
  isMyTurn: boolean;
  mustMove?: boolean;
  legalTokenIds: number[];
  lastDice?: number | null;
  onTokenClick: (tokenId: number) => void;
  moveEffect?: {
    color: LudoColor;
    tokenId: number;
    killed?: { color: LudoColor; tokenId: number }[];
  } | null;
};

export const LudoBoard = memo(
  ({
    board,
    playerColor,
    currentTurn,
    isMyTurn,
    mustMove,
    legalTokenIds,
    lastDice,
    onTokenClick,
    moveEffect,
  }: LudoBoardProps) => {
    const highlights = useMemo(() => {
      if (!playerColor || !isMyTurn || !mustMove) return new Set<string>();

      const next = new Set<string>();
      board[playerColor]
        .filter((token) => legalTokenIds.includes(token.id))
        .forEach((token) => {
          getTrailProgress(token.progress, lastDice).forEach((progress) => {
            const ghost = { id: token.id, progress };
            const [row, col] = getTokenCoord(playerColor, ghost);
            next.add(`${row}-${col}`);
          });
        });
      return next;
    }, [board, isMyTurn, lastDice, legalTokenIds, mustMove, playerColor]);

    const stackedTokens = useMemo(() => {
      const map = new Map<string, { color: LudoColor; tokenId: number; x: number; y: number }[]>();

      ludoColors.forEach((color) => {
        board[color].forEach((token) => {
          const [row, col] = getTokenCoord(color, token);
          const point = center(row, col);
          const key = `${row}-${col}`;
          map.set(key, [...(map.get(key) || []), { color, tokenId: token.id, ...point }]);
        });
      });

      return [...map.values()].flatMap((items) =>
        items.map((item, index) => ({
          ...item,
          x: item.x + ((index % 2) - 0.5) * Math.min(14, items.length * 5),
          y: item.y + (Math.floor(index / 2) - 0.5) * Math.min(14, items.length * 5),
        }))
      );
    }, [board]);

    const renderPathTiles = () =>
      pathCoords.map(([row, col], index) => {
        const key = `${row}-${col}`;
        const entryColor = ludoColors.find((color) => startOffsets[color] === index);
        const isSafe = safeSquares.has(index);

        return (
          <g key={`path-${index}`}>
            <rect
              x={col * tile + 2}
              y={row * tile + 2}
              width={tile - 4}
              height={tile - 4}
              rx="7"
              fill={entryColor ? paint[entryColor].soft : "#ffffff"}
              stroke={entryColor ? paint[entryColor].main : "#cbd5e1"}
              strokeWidth={entryColor ? 2.5 : 1.2}
            />
            {highlights.has(key) && (
              <rect
                x={col * tile + 6}
                y={row * tile + 6}
                width={tile - 12}
                height={tile - 12}
                rx="8"
                fill="#385FF4"
                opacity="0.22"
                className="ludo-path-highlight"
              />
            )}
            {isSafe && (
              <path
                d={`M ${col * tile + 20} ${row * tile + 8} L ${col * tile + 24} ${
                  row * tile + 17
                } L ${col * tile + 34} ${row * tile + 18} L ${col * tile + 26} ${
                  row * tile + 25
                } L ${col * tile + 29} ${row * tile + 35} L ${col * tile + 20} ${
                  row * tile + 30
                } L ${col * tile + 11} ${row * tile + 35} L ${col * tile + 14} ${
                  row * tile + 25
                } L ${col * tile + 6} ${row * tile + 18} L ${col * tile + 16} ${
                  row * tile + 17
                } Z`}
                fill={entryColor ? paint[entryColor].main : "#94a3b8"}
                opacity="0.65"
              />
            )}
          </g>
        );
      });

    const renderHome = (color: LudoColor, x: number, y: number) => (
      <g key={`home-${color}`}>
        <rect x={x} y={y} width="240" height="240" rx="28" fill={paint[color].main} />
        <rect x={x + 34} y={y + 34} width="172" height="172" rx="24" fill="#ffffff" opacity="0.96" />
        {homeCoords[color].map(([row, col], index) => {
          const point = center(row, col);
          return (
            <circle
              key={`${color}-home-${index}`}
              cx={point.x}
              cy={point.y}
              r="24"
              fill={paint[color].soft}
              stroke={paint[color].main}
              strokeWidth="5"
            />
          );
        })}
      </g>
    );

    return (
      <div className="mx-auto aspect-square w-full max-w-[560px] rounded border-8 border-[#252525] bg-[#f8fafc] p-1 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <svg
          viewBox="0 0 600 600"
          className="h-full w-full overflow-visible rounded-sm"
          role="img"
          aria-label="Real-time Ludo board"
        >
          <defs>
            <filter id="tokenShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#020617" floodOpacity="0.35" />
            </filter>
            <radialGradient id="tokenGloss" cx="32%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="38%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </radialGradient>
          </defs>

          <rect width="600" height="600" rx="18" fill="#e2e8f0" />
          {renderHome("green", 0, 0)}
          {renderHome("red", 360, 0)}
          {renderHome("yellow", 0, 360)}
          {renderHome("blue", 360, 360)}

          {renderPathTiles()}

          {ludoColors.map((color) =>
            laneCoords[color].map(([row, col], index) => (
              <rect
                key={`${color}-lane-${index}`}
                x={col * tile + 3}
                y={row * tile + 3}
                width={tile - 6}
                height={tile - 6}
                rx="7"
                fill={paint[color].main}
                stroke="#ffffff"
                strokeWidth="1.5"
                opacity={index === 5 ? 0.95 : 0.8}
              />
            ))
          )}

          <polygon points="240,240 300,300 240,360" fill={paint.yellow.main} />
          <polygon points="240,240 360,240 300,300" fill={paint.green.main} />
          <polygon points="360,240 360,360 300,300" fill={paint.red.main} />
          <polygon points="240,360 360,360 300,300" fill={paint.blue.main} />
          <circle cx="300" cy="300" r="26" fill="#0f172a" stroke="#ffffff" strokeWidth="4" />

          {stackedTokens.map((token) => {
            const canMove =
              token.color === playerColor &&
              isMyTurn &&
              mustMove &&
              legalTokenIds.includes(token.tokenId);
            const isActive = token.color === currentTurn;
            const isCaptured = moveEffect?.killed?.some(
              (item) => item.color === token.color && item.tokenId === token.tokenId
            );
            const isMoving =
              moveEffect?.color === token.color && moveEffect.tokenId === token.tokenId;

            return (
              <g
                key={`${token.color}-${token.tokenId}`}
                className={`ludo-token ${canMove ? "ludo-token-movable" : ""} ${
                  isMoving ? "ludo-token-moving" : ""
                } ${isCaptured ? "ludo-token-captured" : ""}`}
                onClick={() => canMove && onTokenClick(token.tokenId)}
                role="button"
                aria-label={`${token.color} token ${token.tokenId + 1}`}
                style={{
                  cursor: canMove ? "pointer" : "default",
                  transform: `translate(${token.x}px, ${token.y}px)`,
                }}
              >
                {isActive && <circle r="24" fill={paint[token.color].main} opacity="0.24" className="ludo-turn-ring" />}
                <circle r="17" fill={paint[token.color].deep} filter="url(#tokenShadow)" />
                <circle r="15" fill={paint[token.color].main} />
                <circle r="15" fill="url(#tokenGloss)" />
                <circle cx="-5" cy="-6" r="4" fill="#ffffff" opacity="0.55" />
                <text
                  y="5"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="900"
                  fill={token.color === "yellow" ? "#0f172a" : "#ffffff"}
                >
                  {token.tokenId + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
);

LudoBoard.displayName = "LudoBoard";
