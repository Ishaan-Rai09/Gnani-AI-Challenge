import type { Metadata } from "next";
import { HistoryView } from "@/components/history/HistoryView";

export const metadata: Metadata = {
  title: "Call history",
  description: "Search, filter, and revisit every screened simulated call.",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ risk?: string }>;
}) {
  const params = await searchParams;
  return <HistoryView initialRisk={params.risk} />;
}
