export type LudoColor = "red" | "green" | "yellow" | "blue";

export type LudoToken = {
  id: number;
  progress: number;
};

export type LudoBoardState = Record<LudoColor, LudoToken[]>;

export const ludoColors: LudoColor[] = ["red", "green", "yellow", "blue"];

export const startOffsets: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const safeSquares = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const pathCoords = [
  [6, 13],
  [6, 12],
  [6, 11],
  [6, 10],
  [6, 9],
  [5, 8],
  [4, 8],
  [3, 8],
  [2, 8],
  [1, 8],
  [0, 8],
  [0, 7],
  [0, 6],
  [1, 6],
  [2, 6],
  [3, 6],
  [4, 6],
  [5, 6],
  [6, 5],
  [6, 4],
  [6, 3],
  [6, 2],
  [6, 1],
  [6, 0],
  [7, 0],
  [8, 0],
  [8, 1],
  [8, 2],
  [8, 3],
  [8, 4],
  [8, 5],
  [9, 6],
  [10, 6],
  [11, 6],
  [12, 6],
  [13, 6],
  [14, 6],
  [14, 7],
  [14, 8],
  [13, 8],
  [12, 8],
  [11, 8],
  [10, 8],
  [9, 8],
  [8, 9],
  [8, 10],
  [8, 11],
  [8, 12],
  [8, 13],
  [8, 14],
  [7, 14],
  [6, 14],
];

export const homeCoords: Record<LudoColor, number[][]> = {
  red: [
    [2.2, 11.2],
    [3.8, 11.2],
    [2.2, 12.8],
    [3.8, 12.8],
  ],
  green: [
    [2.2, 2.2],
    [3.8, 2.2],
    [2.2, 3.8],
    [3.8, 3.8],
  ],
  yellow: [
    [11.2, 2.2],
    [12.8, 2.2],
    [11.2, 3.8],
    [12.8, 3.8],
  ],
  blue: [
    [11.2, 11.2],
    [12.8, 11.2],
    [11.2, 12.8],
    [12.8, 12.8],
  ],
};

export const laneCoords: Record<LudoColor, number[][]> = {
  red: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
  ],
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ],
  yellow: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
  ],
};

export const normalizeBoard = (board?: Partial<Record<LudoColor, LudoToken[]>>) => {
  const next: LudoBoardState = {
    red: [],
    green: [],
    yellow: [],
    blue: [],
  };

  ludoColors.forEach((color) => {
    next[color] =
      board?.[color] ||
      Array.from({ length: 4 }, (_, id) => ({
        id,
        progress: -1,
      }));
  });

  return next;
};

export const getTokenCoord = (color: LudoColor, token: LudoToken) => {
  if (token.progress < 0) return homeCoords[color][token.id] || homeCoords[color][0];
  if (token.progress >= 57) return [7, 7];
  if (token.progress >= 52) return laneCoords[color][token.progress - 52] || [7, 7];

  const pathIndex = (startOffsets[color] + token.progress) % 52;
  return pathCoords[pathIndex];
};

export const getTrailProgress = (from: number, dice?: number | null) => {
  if (!dice) return [];
  const start = from < 0 ? 0 : from + 1;
  return Array.from({ length: from < 0 ? 1 : dice }, (_, index) => start + index).filter(
    (progress) => progress <= 57,
  );
};
