/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        "primary-dark": "#2563eb",
        secondary: "#f43f5e",
        "secondary-dark": "#e11d48",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        light: "#f3f4f6",
        dark: "#1f2937",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwindcss-animate"),
  ],
}