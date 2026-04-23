
import CreateChallengePage from "@/pages/createchallenge/CreateChallengePage";
import { createFileRoute } from "@tanstack/react-router";



export const Route = createFileRoute("/createchallenge")({
  component: CreateChallengePage,
});

