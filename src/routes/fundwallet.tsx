import Fundwallet from "@/pages/fundwallet/Fundwallet";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";

export const Route = createFileRoute("/fundwallet")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <Fundwallet />
    </ProtectedRoute>
  ),
});
