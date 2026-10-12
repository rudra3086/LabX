import type { Config } from "tailwindcss";

// ============================================================================
// SmartLab design tokens — Microsoft Teams / Fluent 2 inspired.
//
// The palette keeps the historical token names (`navy`, `teal`, `surface`,
// `brand`) so every existing component re-skins automatically, but the values
// now map to the Teams brand purple and the Fluent 2 neutral ramp.
// ============================================================================

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Teams brand purple (§ full Fluent redesign).
        navy: {
          50: "#F5F5FF",
          100: "#EBECFA",
          200: "#D9DBF5",
          300: "#BFC2EC",
          400: "#9A9FE0",
          500: "#7B81D6",
          600: "#5B5FC7", // Teams primary
          700: "#4F52B2", // hover
          800: "#464775", // pressed / legacy Teams
          900: "#3B3D66",
          950: "#2B2C4A",
        },
        // Secondary accent mapped onto the same brand ramp so any remaining
        // `teal-*` usage stays on-palette.
        teal: {
          50: "#F5F5FF",
          100: "#EBECFA",
          200: "#D9DBF5",
          300: "#BFC2EC",
          400: "#9A9FE0",
          500: "#7B81D6",
          600: "#5B5FC7",
          700: "#4F52B2",
          800: "#464775",
          900: "#3B3D66",
          950: "#2B2C4A",
        },
        // Fluent 2 neutral ramp.
        surface: {
          50: "#FAF9F8", // neutralBackground2
          100: "#F3F2F1", // neutralBackground3
          200: "#EDEBE9", // neutralBackground4
          300: "#D1D1D1", // neutralStroke1
          400: "#A19F9D", // neutralForeground4
          500: "#605E5C",
          600: "#484644",
          700: "#323130",
          800: "#201F1E",
          900: "#1B1A19",
          950: "#0F0F0E",
        },
        brand: {
          bg: "#F3F2F1",
          surface: "#FFFFFF",
          muted: "#FAF9F8",
          border: "#E0E0E0",
          text: "#242424",
          subtext: "#616161",
        },
      },
      // Teams / Fluent 2 type ramp, nudged up one step for readability.
      // Named sizes are authoritative so the whole app scales together.
      fontSize: {
        xs: ["13px", { lineHeight: "18px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["15px", { lineHeight: "22px" }],
        lg: ["17px", { lineHeight: "24px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "Cascadia Code",
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        fluent: "4px",
        fluentLg: "8px",
      },
      boxShadow: {
        // Fluent 2 elevation tokens.
        card: "0 1px 2px rgba(0, 0, 0, 0.07)",
        elevated:
          "0 8px 16px rgba(0, 0, 0, 0.14), 0 0 2px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
