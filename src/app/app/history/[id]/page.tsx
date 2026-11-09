import type { Metadata } from "next";
import { CallDetailView } from "@/components/history/CallDetailView";

export const metadata: Metadata = {
  title: "Call detail",
  description: "Full transcript, risk signals, AI summary, and decision timeline for a screened call.",
};

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CallDetailView id={id} />;
}
