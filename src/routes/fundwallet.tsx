import Fundwallet from "@/pages/fundwallet/Fundwallet";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fundwallet")({
  component: () => (
    <Fundwallet />
),
});
