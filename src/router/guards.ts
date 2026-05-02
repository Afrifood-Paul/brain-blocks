import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "./context";
import { consumeAuthRedirect, storeAuthRedirect } from "@/services/authRedirect";

type BeforeLoadContext = {
  context: RouterContext;
};

export const requireAuth = ({ context }: BeforeLoadContext) => {
  if (context.auth.loading) {
    return;
  }

  if (!context.auth.isAuthenticated) {
    storeAuthRedirect();

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
    const redirectUrl = consumeAuthRedirect();

    throw redirect({
      to: redirectUrl || "/dashboard",
      replace: true,
    });
  }
};
