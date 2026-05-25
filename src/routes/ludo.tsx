import Ludo from "@/pages/ludo/Ludo";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";

export const Route = createFileRoute("/ludo")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <Ludo />
    </ProtectedRoute>
  ),
});
