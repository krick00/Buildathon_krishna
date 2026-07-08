import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f1115",
          soft: "#1a1d24",
          card: "#20242e",
          line: "#2c313c",
        },
        cream: "#f5f1e8",
        accent: {
          DEFAULT: "#e8a13a",
          soft: "#f2c078",
        },
        moss: "#5b8c6e",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
