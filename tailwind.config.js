/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",
        primaryDark: "#4338ca",
        primaryLight: "#6366f1",
        secondary: "#1E293B",
        background: "#F8FAFC",
        text: "#0F172A",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
