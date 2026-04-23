import Register from "@/pages/register/Register";
import { createFileRoute, useNavigate } from "@tanstack/react-router";


export const Route = createFileRoute("/register")({
  component: Register,
});

