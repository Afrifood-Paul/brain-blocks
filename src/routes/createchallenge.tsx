
import CreateChallengePage from "@/pages/createchallenge/CreateChallengePage";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";



export const Route = createFileRoute("/createchallenge")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <CreateChallengePage />
    </ProtectedRoute>
  ),
});
