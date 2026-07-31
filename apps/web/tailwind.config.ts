import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: { ink: "#0f172a", panel: "#ffffff" },
      boxShadow: { glow: "0 24px 80px rgba(49, 46, 129, .16)" }
    }
  },
  plugins: []
} satisfies Config
