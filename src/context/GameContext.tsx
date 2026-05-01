import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Chess } from "chess.js";
import { socket } from "../services/socket";

// ✅ 1. Define context type
type GameContextType = {
  game: Chess;
  turn: string;
  players: string[];
  whiteTime: number;
  blackTime: number;
  joinGame: (id: string) => void;
  makeMove: (move: any) => void;
};

// ✅ 2. Fix context typing
const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [turn, setTurn] = useState("w");
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);

  useEffect(() => {
    socket.connect();

    socket.on("game-state", (data: any) => {
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setTurn(newGame.turn());
      setPlayers(data.players);
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
    });

    socket.on("move", ({ fen }: any) => {
      const newGame = new Chess(fen);
      setGame(newGame);
      setTurn(newGame.turn());
    });

    socket.on("timer", ({ whiteTime, blackTime }: any) => {
      setWhiteTime(whiteTime);
      setBlackTime(blackTime);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ✅ 3. Fix incorrect type
  const joinGame = (id: string) => {
    setGameId(id);
    socket.emit("join-game", id);
  };

  const makeMove = (move: any) => {
    socket.emit("move", {
      gameId,
      move,
    });
  };

  return (
    <GameContext.Provider
      value={{
        game,
        turn,
        players,
        whiteTime,
        blackTime,
        joinGame,
        makeMove,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// ✅ 4. Safe hook
export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }

  return context;
};