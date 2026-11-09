import type { Metadata } from "next";
import { BlocklistView } from "@/components/blocklist/BlocklistView";

export const metadata: Metadata = {
  title: "Blocklist",
  description: "Manage the numbers CallShield should keep away from you.",
};

export default function BlocklistPage() {
  return <BlocklistView />;
}
