import type { Config } from "tailwindcss";

// Colors are CSS variables holding RGB triplets (see app/globals.css) so
// Tailwind's opacity modifiers work: bg-ink/5, border-stage-ink/10, etc.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        panel: token("panel"),
        line: token("line"),
        ink: token("ink"),
        "ink-2": token("ink-2"),
        muted: token("muted"),
        tone: token("tone"),
        stage: token("stage"),
        "stage-2": token("stage-2"),
        "stage-ink": token("stage-ink"),
        "stage-label": token("stage-label"),
        "stage-muted": token("stage-muted"),
        signal: token("signal"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        // Shape rule: interactive elements are full pills; every surface
        // (images, cards, the graph stage) uses `surface`.
        surface: "24px",
      },
      maxWidth: {
        page: "1280px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
