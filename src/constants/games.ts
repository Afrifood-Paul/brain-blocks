import chessIcon from "@/assets/chessIcon.png";
import cupIcon from "@/assets/cupIcon.png";
import cup1Icon from "@/assets/cup1Icon.png";
import ludoIcon from "@/assets/ludoIcon.png";
import puzzleIcon from "@/assets/puzzleIcon.png";
import scrabbleIcon from "@/assets/scrabbleIcon.png";
import ticXIcon from "@/assets/tic-xIcon.png";
import ticOIcon from "@/assets/tic-oIcon.png";

export type GameConfig = {
  id: string;
  name: string;
  stake: number;
  bg: string;
  icon?: string;
  icons?: string[];
};

export const GAMES: GameConfig[] = [
  {
    id: "picture-puzzle",
    name: "Picture Puzzle",
    stake: 200,
    bg: "from-[#AFD0F1] to-[#60A3F3]",
    icon: puzzleIcon,
  },
  { id: "ludo", name: "Ludo", stake: 300, bg: "from-[#B5A9FF] to-[#846DFD]", icon: ludoIcon },
  { id: "chess", name: "Chess", stake: 200, bg: "from-[#98DC8F] to-[#5DC161]", icon: chessIcon },
  {
    id: "scrabble",
    name: "Scrabble",
    stake: 200,
    bg: "from-[#FDBC7E] to-[#FD9941]",
    icon: scrabbleIcon,
  },
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    stake: 200,
    bg: "from-[#385FF4] to-[#182E80]",
    icons: [ticXIcon, ticOIcon],
  },
  {
    id: "cup-port",
    name: "Cup Port",
    stake: 200,
    bg: "from-[#A4CAF1] to-[#6BA9F3]",
    icons: [cupIcon, cup1Icon],
  },
];

export const DEFAULT_GAME_STAKE = 200;

export const findGameById = (gameId?: string | null) => GAMES.find((game) => game.id === gameId);
