import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { storeAuthRedirect } from "@/services/authRedirect";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!auth.isAuthenticated) {
    storeAuthRedirect();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
