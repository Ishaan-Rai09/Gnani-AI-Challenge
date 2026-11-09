import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { CallShieldProvider } from "@/lib/store";
import { VoiceProvider } from "@/lib/voice/VoiceProvider";
import { ServiceWorkerRegister } from "@/components/system/ServiceWorkerRegister";
import { ToastViewport } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CallShield — Your calls. Your control.",
    template: "%s · CallShield",
  },
  description:
    "CallShield lets an AI assistant screen unknown callers, understand their intent, and flag suspicious conversations before they reach you.",
  applicationName: "CallShield",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CallShield",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#151B26",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        <CallShieldProvider>
          <VoiceProvider>
            {children}
            <ToastViewport />
            <ServiceWorkerRegister />
          </VoiceProvider>
        </CallShieldProvider>
      </body>
    </html>
  );
}
