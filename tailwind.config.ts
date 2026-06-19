import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        noir: "rgb(var(--noir-rgb) / <alpha-value>)",
        mist: "rgb(var(--mist-rgb) / <alpha-value>)",
        ash: "rgb(var(--ash-rgb) / <alpha-value>)",
        hairline: "var(--hairline)",
      },
      fontFamily: {
        // Manrope — clean grotesque body/UI (full Cyrillic)
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Prata — high-contrast didone display serif (full Cyrillic)
        display: ["var(--font-prata)", "Georgia", "serif"],
      },
      letterSpacing: {
        widest2: "0.22em",
        widest3: "0.3em",
      },
      maxWidth: {
        edge: "1680px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "drawer-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "drawer-in": "drawer-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease both",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
