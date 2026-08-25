import { createFileRoute } from "@tanstack/react-router";
import { ClaimGateApp } from "@/components/claimgate/claimgate-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ClaimGateApp />;
}
