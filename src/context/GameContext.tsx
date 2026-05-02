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

type GameContextType = {
  game: Chess;
  turn: string;
  players: any;
  playerColor: PlayerColor | null;
  status: string;
  winnerColor: PlayerColor | null;
  winner: any;
  moveHistory: any[];
  sharedTime: number;
  timerStartedAt: string | null;
  joinGame: (id: string) => void;
  makeMove: (move: any) => boolean;
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState<string | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const playerColorRef = useRef<PlayerColor | null>(null);
  const statusRef = useRef("active");
  const currentFenRef = useRef(game.fen());
  const [players, setPlayers] = useState<any>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [status, setStatus] = useState("active");
  const [winnerColor, setWinnerColor] = useState<PlayerColor | null>(null);
  const [winner, setWinner] = useState<any>(null);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
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

    const applyServerState = (data: any) => {
      if (!data || data.error) return;

      if (data.boardState || data.fen) {
        const nextFen = data.boardState || data.fen;
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

  const makeMove = useCallback((move: any) => {
    if (
      !gameIdRef.current ||
      statusRef.current !== "active" ||
      !socket.connected
    ) {
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
