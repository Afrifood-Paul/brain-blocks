import Joinchallenge from "@/pages/joinchallenge/Joinchallenge";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";

export const Route = createFileRoute("/joinchallenge")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <Joinchallenge />
    </ProtectedRoute>
  ),
});
