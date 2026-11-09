import type { Metadata } from "next";
import { AssistantView } from "@/components/assistant/AssistantView";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Choose how your CallShield assistant screens unknown callers.",
};

export default function AssistantPage() {
  return <AssistantView />;
}
