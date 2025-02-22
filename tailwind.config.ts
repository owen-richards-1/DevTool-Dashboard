import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      // Custom font "PT Sans" as the default sans-serif font
      sans: ['"PT Sans"', 'sans-serif'],
    },
    extend: {
      colors: {
        // You can add custom colors here
      },
    },
  },
  plugins: [],
} satisfies Config;