import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "./context";

type BeforeLoadContext = {
  context: RouterContext;
};

export const requireAuth = ({ context }: BeforeLoadContext) => {
  if (context.auth.loading) {
    return;
  }

  if (!context.auth.isAuthenticated) {
    throw redirect({
      to: "/login",
      replace: true,
    });
  }
};

export const redirectIfAuthenticated = ({ context }: BeforeLoadContext) => {
  if (context.auth.loading) {
    return;
  }

  if (context.auth.isAuthenticated) {
    throw redirect({
      to: "/dashboard",
      replace: true,
    });
  }
};
