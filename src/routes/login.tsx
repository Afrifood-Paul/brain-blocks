import { createFileRoute} from "@tanstack/react-router";
import Login from "@/pages/login/Login";
import { redirectIfAuthenticated } from "@/router/guards";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfAuthenticated,
  component: Login,
});

