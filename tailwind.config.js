/** Djob : système de design. Inter seule, neutres chauds, un vert sobre en accent. */
module.exports = {
  content: ["./index.html", "./app.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        ink: { DEFAULT: "#111110", soft: "#3A3A37", muted: "#6B6A65", faint: "#9C9B96" },
        line: { DEFAULT: "#E7E5E0", strong: "#D6D3CC" },
        paper: { DEFAULT: "#FFFFFF", warm: "#FAFAF8", sunk: "#F4F3EF" },
        brand: { 50: "#EFF6F1", 100: "#DCEDE2", 500: "#16794A", 600: "#0E6A3E", 700: "#0B5533", 900: "#0A2E1E" },
        signal: { red: "#B42318", redbg: "#FEF3F2", amber: "#8A5A00", amberbg: "#FDF6E3" },
      },
      fontSize: {
        "display": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.045em", fontWeight: "600" }],
        "title": ["clamp(1.875rem, 3.6vw, 2.75rem)", { lineHeight: "1.08", letterSpacing: "-0.035em", fontWeight: "600" }],
      },
      maxWidth: { page: "72rem" },
      borderRadius: { xl2: "1.125rem" },
      boxShadow: {
        hair: "0 1px 0 rgba(17,17,16,.04)",
        lift: "0 1px 2px rgba(17,17,16,.04), 0 8px 24px -8px rgba(17,17,16,.10)",
        sheet: "0 24px 64px -12px rgba(17,17,16,.25)",
      },
      transitionTimingFunction: { out: "cubic-bezier(.22,1,.36,1)" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        slideup: { from: { transform: "translateY(24px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        slidein: { from: { transform: "translateX(24px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
      },
      animation: {
        rise: "rise .45s cubic-bezier(.22,1,.36,1) both",
        slideup: "slideup .3s cubic-bezier(.22,1,.36,1)",
        slidein: "slidein .3s cubic-bezier(.22,1,.36,1)",
      },
    },
  },
  plugins: [],
};
