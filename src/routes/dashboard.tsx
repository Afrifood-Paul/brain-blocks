import Dashboard from "@/pages/dashboard/Dashboard";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
});
