/** @type {import('tailwindcss').Config} */
// Palette is derived from the logo: teal #37C1C3, blue #3B99DB, green #34D073, amber #F5B027, coral #F24349.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Theme-aware scales: the CSS variables in index.css flip these for light mode.
        slate: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, `rgb(var(--s-${n}) / <alpha-value>)`])),
        teal: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, `rgb(var(--t-${n}) / <alpha-value>)`])),
        amber: { 300: "rgb(var(--amber-300) / <alpha-value>)", 400: "rgb(var(--amber-400) / <alpha-value>)" },
        // "violet" is remapped to the logo's teal so every accent follows the brand
        violet: {
          50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#6ee7ee", 400: "#4fd3d6",
          500: "#37c1c3", 600: "#37c1c3", 700: "#2aa3a8", 800: "#1d676b", 900: "#124a4e", 950: "#0b2a2d",
        },
        brand: { teal: "#37C1C3", blue: "#3B99DB", green: "#34D073", amber: "#F5B027", coral: "#F24349" },
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        ripple: { "0%": { transform: "scale(.4)", opacity: ".7" }, "100%": { transform: "scale(2.2)", opacity: "0" } },
        "pin-bounce": {
          "0%,100%": { transform: "translateY(0) scaleY(1)" },
          "45%": { transform: "translateY(-26px) scaleY(1.04)" },
          "85%": { transform: "translateY(0) scaleY(.9)" },
        },
        wave: { "0%,60%,100%": { transform: "translateY(0)" }, "30%": { transform: "translateY(-6px)" } },
        sweep: { to: { transform: "rotate(360deg)" } },
        caret: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
        pan: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        "node-pop": { "0%,100%": { transform: "scale(.6)", opacity: ".4" }, "50%": { transform: "scale(1.15)", opacity: "1" } },
        orbit: { to: { transform: "rotate(360deg)" } },
        draw: { "0%": { strokeDashoffset: "400" }, "70%,100%": { strokeDashoffset: "0" } },
        run: { from: { offsetDistance: "0%" }, to: { offsetDistance: "100%" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-8px)" }, "40%,80%": { transform: "translateX(8px)" } },
        indeterminate: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(300%)" } },
      },
      animation: {
        "fade-up": "fade-up .6s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        ripple: "ripple 1.8s ease-out infinite",
        "pin-bounce": "pin-bounce 1.1s cubic-bezier(.3,0,.4,1) infinite",
        wave: "wave 1.1s ease-in-out infinite",
        sweep: "sweep 2.4s linear infinite",
        caret: "caret 1s steps(1) infinite",
        pan: "pan 6s linear infinite",
        "node-pop": "node-pop 2s ease-in-out infinite",
        orbit: "orbit 14s linear infinite",
        draw: "draw 3.6s ease-in-out infinite",
        run: "run 3.6s ease-in-out infinite",
        shake: "shake .5s ease-in-out",
        indeterminate: "indeterminate 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
