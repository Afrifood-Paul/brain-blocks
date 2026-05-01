import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import Chessboard from "@/pages/chessboard/Chessboard";
import { GameProvider } from "@/context/GameContext";



export const Route = createFileRoute("/chessboard")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
    <GameProvider>
         <Chessboard/>
    </GameProvider>
    </ProtectedRoute>
  ),
});