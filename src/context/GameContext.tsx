import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Chess } from "chess.js";
import { connectSocket, socket } from "../services/socket";

type PlayerColor = "w" | "b";

type ChessPlayer = {
  name?: string;
  username?: string;
  avatar?: string | null;
};

type ChessPlayers = {
  white?: ChessPlayer | null;
  black?: ChessPlayer | null;
};

type ChessMove = {
  from: string;
  to: string;
  promotion?: string;
};

type MoveHistoryItem = Record<string, unknown>;

type ServerGameState = {
  error?: unknown;
  boardState?: string;
  fen?: string;
  currentTurn?: PlayerColor;
  players?: ChessPlayers | null;
  playerColor?: PlayerColor | null;
  status?: string;
  winnerColor?: PlayerColor | null;
  winner?: ChessPlayer | null;
  moveHistory?: MoveHistoryItem[];
  sharedTime?: number;
  timerStartedAt?: string | null;
};

type GameContextType = {
  game: Chess;
  turn: string;
  players: ChessPlayers | null;
  playerColor: PlayerColor | null;
  status: string;
  winnerColor: PlayerColor | null;
  winner: ChessPlayer | null;
  moveHistory: MoveHistoryItem[];
  sharedTime: number;
  timerStartedAt: string | null;
  joinGame: (id: string) => void;
  makeMove: (move: ChessMove) => boolean;
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState<string | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const playerColorRef = useRef<PlayerColor | null>(null);
  const statusRef = useRef("active");
  const currentFenRef = useRef(game.fen());
  const [players, setPlayers] = useState<ChessPlayers | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [status, setStatus] = useState("active");
  const [winnerColor, setWinnerColor] = useState<PlayerColor | null>(null);
  const [winner, setWinner] = useState<ChessPlayer | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [turn, setTurn] = useState("w");
  const [sharedTime, setSharedTime] = useState(600);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);

  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    connectSocket();

    const applyServerState = (data: ServerGameState) => {
      if (!data || data.error) return;

      const nextFen = data.boardState || data.fen;

      if (nextFen) {
        const nextGame = new Chess(nextFen);

        if (nextFen !== currentFenRef.current) {
          currentFenRef.current = nextFen;
          setGame(nextGame);
        }

        setTurn(data.currentTurn || nextGame.turn());
      } else if (data.currentTurn) {
        setTurn(data.currentTurn);
      }

      setPlayers(data.players || null);
      setPlayerColor(data.playerColor ?? playerColorRef.current);
      setStatus(data.status || "active");
      setWinnerColor(data.winnerColor || null);
      setWinner(data.winner || null);
      setMoveHistory(data.moveHistory || []);

      if (typeof data.sharedTime === "number") setSharedTime(data.sharedTime);
      setTimerStartedAt(data.timerStartedAt || null);
    };

    socket.on("game_state", applyServerState);
    socket.on("move_made", applyServerState);
    socket.on("game_over", applyServerState);

    return () => {
      socket.off("game_state", applyServerState);
      socket.off("move_made", applyServerState);
      socket.off("game_over", applyServerState);
      socket.disconnect();
    };
  }, []);

  const joinGame = useCallback((id: string) => {
    setGameId(id);
    gameIdRef.current = id;
    connectSocket();
    socket.emit("join_game", { gameId: id });
  }, []);

  const makeMove = useCallback((move: ChessMove) => {
    if (!gameIdRef.current || statusRef.current !== "active" || !socket.connected) {
      return false;
    }

    socket.emit("make_move", {
      gameId: gameIdRef.current,
      move,
    });

    return true;
  }, []);

  return (
    <GameContext.Provider
      value={{
        game,
        turn,
        players,
        playerColor,
        status,
        winnerColor,
        winner,
        moveHistory,
        sharedTime,
        timerStartedAt,
        joinGame,
        makeMove,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }

  return context;
};
