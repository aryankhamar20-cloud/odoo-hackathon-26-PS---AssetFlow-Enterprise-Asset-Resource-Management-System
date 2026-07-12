import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        "ink-soft": "#3A4356",
        paper: "#EDEFF3",
        "paper-raised": "#FFFFFF",
        border: "#D7DAE1",
        teal: { DEFAULT: "#0E7C86", soft: "#E4F1F2" },
        status: {
          available: "#2E8B57",
          allocated: "#3163C4",
          reserved: "#C98A2E",
          maintenance: "#D4712B",
          lost: "#C4443A",
          retired: "#8A8F98",
          disposed: "#4A4E57",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
