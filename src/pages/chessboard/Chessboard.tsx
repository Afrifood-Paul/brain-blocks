import { Chessboard as Board } from "react-chessboard";
import { useGame } from "@/context/GameContext";

const Chessboard = () => {
  const { game, makeMove } = useGame();

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    return true;
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white">
      <div className="mb-4">Multiplayer Chess</div>

      <Board
        position={game.fen()}
        onPieceDrop={onDrop}
      />
    </div>
  );
};

export default Chessboard;