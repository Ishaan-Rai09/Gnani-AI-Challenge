import type { Metadata } from "next";
import { LiveView } from "@/components/live/LiveView";

export const metadata: Metadata = {
  title: "Live screening",
  description: "Watch an AI assistant screen a simulated unknown caller in real time.",
};

export default function LivePage() {
  return <LiveView />;
}
