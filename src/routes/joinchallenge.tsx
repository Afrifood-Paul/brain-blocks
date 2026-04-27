import Joinchallenge from "@/pages/joinchallenge/Joinchallenge";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/joinchallenge")({
  component: Joinchallenge,
});
