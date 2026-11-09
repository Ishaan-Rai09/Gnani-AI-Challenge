import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151B26",
        ivory: "#F5F3ED",
        signal: "#FF6B35",
        inkSoft: "#232B3A",
        muted: "#6D7280",
        line: "#E3DFD4",
        paper: "#FCFBF7",
        ash: "#EDEAE1",
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      boxShadow: {
        lift: "0 1px 2px rgba(21,27,38,0.04), 0 12px 32px -12px rgba(21,27,38,0.16)",
        panel: "0 1px 0 rgba(21,27,38,0.04), 0 24px 60px -30px rgba(21,27,38,0.25)",
        signal: "0 8px 24px -10px rgba(255,107,53,0.55)",
      },
      letterSpacing: {
        micro: "0.16em",
      },
      keyframes: {
        "ring-pulse": {
          "0%": { transform: "scale(0.9)", opacity: "0.55" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "sheen": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(220%)" },
        },
        "caret": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "bar-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "ring-pulse": "ring-pulse 2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite",
        "rise-in": "rise-in 0.35s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        sheen: "sheen 1.8s ease-in-out infinite",
        caret: "caret 1s steps(2, start) infinite",
        "bar-grow": "bar-grow 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
