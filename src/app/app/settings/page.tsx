import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your CallShield prototype profile, demo data, and installed app.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
