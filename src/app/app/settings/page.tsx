import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your CallShield account, saved data, and installed app.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
