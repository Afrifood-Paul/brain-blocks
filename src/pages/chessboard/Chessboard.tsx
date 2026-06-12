import { useEffect } from "react";
import type { Square } from "chess.js";
import { Chessboard as Board } from "react-chessboard";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import defaultAvatar from "@/assets/chessIcon.png";
import { API_ORIGIN } from "@/services/api";
import { useNavigate } from "@tanstack/react-router";

type ChessPlayer = {
  name?: string;
  username?: string;
  avatar?: string | null;
};

type ChessMove = {
  to: string;
  promotion?: string;
};

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
const navigate = useNavigate()
  const getPlayer = (color: "w" | "b"): ChessPlayer | null | undefined =>
    color === "w" ? players?.white : players?.black;

  const getDisplayName = (player: ChessPlayer | null | undefined, fallback: string) =>
    player?.name || player?.username || fallback;

  const getAvatarSrc = (avatar?: string | null) => {
    if (!avatar) return defaultAvatar;
    if (/^https?:\/\//i.test(avatar)) return avatar;
    return avatar.startsWith("/") ? `${API_ORIGIN}${avatar}` : avatar;
  };

  const renderPlayer = (
    player: ChessPlayer | null | undefined,
    fallbackName: string,
    isActive: boolean,
  ) => (
    <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-md px-0 py-3 sm:px-4">
      <button
        onClick={() => navigate({ to: "/marketplace" })}
        className="flex items-center gap-2 rounded bg-[#0B2177] px-4 py-2 text-white text-xs font-semibold shadow-sm"
      >
        Home
      </button>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-[#9FC8F6] border-4 border-[#008FF0] overflow-hidden sm:h-14 sm:w-14">
          <img
            src={getAvatarSrc(player?.avatar)}
            alt={getDisplayName(player, fallbackName)}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-bold leading-tight text-white sm:text-xl">
            {"@" + getDisplayName(player, fallbackName)}
          </div>
          <div className="text-xs text-white/60">{isActive ? "Thinking..." : "Waiting"}</div>
        </div>
      </div>
      <div className="shrink-0 rounded border border-[#008FF0] bg-[#46597A] px-4 py-2 sm:px-6 sm:py-3">
        <span className="font-mono text-base font-bold tabular-nums text-foreground sm:text-lg">
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

    const piece = game.get(sourceSquare as Square);
    if (!piece || piece.color !== playerColor) {
      return false;
    }

    const isLegalMove = game
      .moves({ square: sourceSquare as Square, verbose: true })
      .some(
        (move: ChessMove) =>
          move.to === targetSquare && (!move.promotion || move.promotion === "q"),
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
  const boardSize =
    typeof window === "undefined"
      ? 320
      : Math.max(260, Math.min(window.innerWidth - 40, window.innerHeight * 0.62, 420));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-5 text-white">
      {renderPlayer(
        opponentPlayer,
        opponentColor === "w" ? "White" : "Black",
        turn === opponentColor,
      )}

      <div className="flex w-full justify-center">
        <div className="max-w-full overflow-hidden border-4 border-[#333333] sm:border-8">
          <Board
            position={game.fen()}
            onPieceDrop={onDrop}
            boardOrientation={playerColor === "b" ? "black" : "white"}
            boardWidth={boardSize}
            customLightSquareStyle={{ backgroundColor: "#F1E4D1" }}
            customDarkSquareStyle={{ backgroundColor: "#318B4A" }}
          />
        </div>
      </div>

      {renderPlayer(currentPlayer, currentColor === "w" ? "White" : "Black", turn === currentColor)}

      {(status === "draw" || status === "checkmate") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center text-black">
            {status === "draw" ? (
              <h2 className="text-2xl font-bold">Game Draw</h2>
            ) : (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#9FC8F6] overflow-hidden">
                  <img
                    src={getAvatarSrc(winnerPlayer?.avatar)}
                    alt={getDisplayName(winnerPlayer, "Winner")}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="text-2xl font-bold">
                  {getDisplayName(winnerPlayer, winnerColor === "w" ? "White" : "Black")} wins
                </h2>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Chessboard;
