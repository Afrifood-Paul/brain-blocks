import { useEffect } from "react";
import { Chessboard as Board } from "react-chessboard";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";

const Chessboard = () => {
  const { isAuthenticated, loading } = useAuth();
  const {
    game,
    joinGame,
    makeMove,
    players,
    playerColor,
    status,
    winnerColor: serverWinnerColor,
    winner,
    turn,
    sharedTime,
  } = useGame();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getPlayer = (color: "w" | "b") =>
    color === "w" ? players?.white : players?.black;

  const getDisplayName = (player: any, fallback: string) =>
    player?.name || player?.username || fallback;

  const getInitial = (player: any, fallback: string) =>
    getDisplayName(player, fallback).charAt(0).toUpperCase();

  const renderPlayer = (
    player: any,
    fallbackName: string,
    isActive: boolean
  ) => (
    <div className="w-full max-w-[560px] flex items-center justify-between rounded-md  px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#9FC8F6] border border-[#008FF0] text-[#0B2177] flex items-center justify-center font-semibold overflow-hidden">
          {player?.avatar ? (
            <img
              src={player.avatar}
              alt={getDisplayName(player, fallbackName)}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitial(player, fallbackName)
          )}
        </div>
        <div>
          <div className="font-bold text-xl text-white leading-tight">
            {"@" + getDisplayName(player, fallbackName)}
          </div>
          <div className="text-xs text-white/60">
            {isActive ? "Thinking..." : "Waiting"}
          </div>
        </div>
      </div>
      <div className="m-3 px-6 py-3 rounded border border-[#008FF0] bg-[#46597A] ">
        <span className="text-foreground font-mono font-bold text-lg tabular-nums">
          {formatTime(sharedTime)}
        </span>
      </div>
    </div>
  );

  const currentColor = playerColor || "w";
  const opponentColor = currentColor === "w" ? "b" : "w";
  const currentPlayer = getPlayer(currentColor);
  const opponentPlayer = getPlayer(opponentColor);
  const winnerColor =
    serverWinnerColor || (status === "checkmate" ? (turn === "w" ? "b" : "w") : null);
  const winnerPlayer = winner || (winnerColor ? getPlayer(winnerColor) : null);

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("gameId");

    if (gameId) {
      joinGame(gameId);
    }
  }, [isAuthenticated, joinGame, loading]);

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (!game || !playerColor || status !== "active" || turn !== playerColor) {
      return false;
    }

    const piece = game.get(sourceSquare as any);
    if (!piece || piece.color !== playerColor) {
      return false;
    }

    const isLegalMove = game
      .moves({ square: sourceSquare as any, verbose: true })
      .some(
        (move: any) =>
          move.to === targetSquare &&
          (!move.promotion || move.promotion === "q")
      );

    if (!isLegalMove) {
      return false;
    }

    return makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white">

      {renderPlayer(
        opponentPlayer,
        opponentColor === "w" ? "White" : "Black",
        turn === opponentColor
      )}

      <Board
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={playerColor === "b" ? "black" : "white"}
        customLightSquareStyle={{ backgroundColor: "#f8faf0" }}
        customDarkSquareStyle={{ backgroundColor: "#3f7f46" }}
      />

      {renderPlayer(
        currentPlayer,
        currentColor === "w" ? "White" : "Black",
        turn === currentColor
      )}

      {(status === "draw" || status === "checkmate") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center text-black">
            {status === "draw" ? (
              <h2 className="text-2xl font-bold">Game Draw</h2>
            ) : (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#9FC8F6] text-[#0B2177] flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {winnerPlayer?.avatar ? (
                    <img
                      src={winnerPlayer.avatar}
                      alt={getDisplayName(winnerPlayer, "Winner")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitial(winnerPlayer, "Winner")
                  )}
                </div>
                <h2 className="text-2xl font-bold">
                  {getDisplayName(
                    winnerPlayer,
                    winnerColor === "w" ? "White" : "Black"
                  )} wins
                </h2>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chessboard;
