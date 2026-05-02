import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // accent — muted indigo, ne neon
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          900: "#312e81",
        },
        // backgrounds — tamni slate s blagom hladnom nijansom
        surface: {
          900: "#08080f",
          800: "#0e0e1c",
          700: "#151529",
          600: "#1d1d38",
          500: "#262648",
        },
        // profit / loss — odvojeni od brand-a
        profit: {
          DEFAULT: "#34d399",
          dim:     "#059669",
          bg:      "#034732",
        },
        loss: {
          DEFAULT: "#fb7185",
          dim:     "#e11d48",
          bg:      "#4c0519",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
