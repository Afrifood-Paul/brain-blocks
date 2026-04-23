import Withdrawal from "@/pages/withdrawal/Withdrawal";
import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/withdrawal")({
  component: Withdrawal,
});


