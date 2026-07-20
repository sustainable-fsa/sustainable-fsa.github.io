/**
 * Tailwind config for the Sustainable FSA site.
 *
 * Brand palette is drought-themed (terracotta + sage + ochre on a warm
 * cream background) and tuned to clear WCAG AA contrast on both the
 * cream body background and white card surfaces. The output is built
 * once by `npm run build:css` into assets/tailwind.css.
 *
 * Content globs are intentionally explicit so Tailwind never scans the
 * Jekyll build output in _site/ or anything in node_modules/.
 */
module.exports = {
  content: [
    "./_layouts/**/*.html",
    "./_includes/**/*.html",
    "./*.{html,md}",
    "./about/**/*.{html,md}",
    "./data/**/*.{html,md}",
    "./publications/**/*.{html,md}",
    "./library/**/*.{html,md}",
    "./team/**/*.{html,md}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      colors: {
        // Terracotta — primary brand. `.dark` is used for body links on
        // cream and for white text on terracotta backgrounds (both clear
        // WCAG AA at the sizes used).
        terracotta: { DEFAULT: "#B7410E", light: "#cf5a26", dark: "#8f320a" },
        // Sage — secondary, used for callouts, accents, and prose
        // counters.
        sage:       { DEFAULT: "#6B8E5A", light: "#88a878", dark: "#52704a" },
        // Ochre — accent, used for eyebrows / bullets.
        //
        //   - `light` (#fdebbb) is the text-safe variant on terracotta
        //     backgrounds (4.71:1 vs #B7410E, clears WCAG AA small for
        //     12 px non-bold text). Two earlier attempts (#f4d57a at 3.87
        //     and #f7dc8e at 4.13) passed AA-large but failed AA-small.
        //   - `dark` (#8a6620) is the text-safe variant on white / cream
        //     backgrounds (5.28:1 vs #ffffff). Darkened from #a87d2e, which
        //     measured 3.61:1 — passed AA-large but failed AA-small.
        ochre: { DEFAULT: "#D9A441", light: "#fdebbb", dark: "#8a6620" },
        // Warm off-white body background.
        cream:      { DEFAULT: "#faf7f2" },
      },
      typography: () => ({
        DEFAULT: {
          css: {
            "--tw-prose-headings":      "#8f320a",
            "--tw-prose-links":         "#8f320a",
            "--tw-prose-bold":          "#1f2937",
            "--tw-prose-counters":      "#52704a",
            "--tw-prose-bullets":       "#8a6620",
            "--tw-prose-hr":            "#e5e7eb",
            "--tw-prose-quote-borders": "#8a6620",
            "--tw-prose-captions":      "#6b7280",
            "--tw-prose-code":          "#8f320a",
            "--tw-prose-th-borders":    "#d1d5db",
            "--tw-prose-td-borders":    "#e5e7eb",
            // Roboto Black for headings inside markdown prose. Weight is
            // single-sourced from --heading-weight (defined in src/tailwind.css).
            h1: { fontWeight: "var(--heading-weight)" },
            h2: { fontWeight: "var(--heading-weight)" },
            h3: { fontWeight: "var(--heading-weight)" },
            h4: { fontWeight: "var(--heading-weight)" },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
