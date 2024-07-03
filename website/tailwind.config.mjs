import starlightPlugin from "@astrojs/starlight-tailwind";

// Generated color palettes
const accent = { 200: "#a5d2db", 600: "#00798a", 900: "#003942", 950: "#002930" };
const gray = {
  100: "#f2f6ff",
  200: "#e5eeff",
  300: "#b6c2da",
  400: "#768bb7",
  500: "#445780",
  700: "#25375d",
  800: "#152549",
  900: "#101829",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        accent,
        gray,
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"'],
        mono: ['"IBM Plex Mono"'],
      },
    },
  },
  plugins: [starlightPlugin()],
};
