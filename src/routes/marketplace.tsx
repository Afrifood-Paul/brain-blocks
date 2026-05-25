import Marketplace from "@/pages/marketplace/Marketplace";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { requireAuth } from "@/router/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/marketplace")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <Marketplace />
    </ProtectedRoute>
  ),
});
