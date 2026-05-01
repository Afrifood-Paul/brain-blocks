import Withdrawal from "@/pages/withdrawal/Withdrawal";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";


export const Route = createFileRoute("/withdrawal")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <Withdrawal />
    </ProtectedRoute>
  ),
});
