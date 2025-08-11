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
        // Primary colors
        primary: {
          light: "#E4EFFF", // Light cyan/teal
          DEFAULT: "#2861E2", // Vibrant teal
          dark: "#154CCA", // Darker teal
        },
        
        // Secondary colors
        secondary: {
          light: "#64748b",
          DEFAULT: "#1e293b",
          dark: "#0f172a",
        },
        
        // Background colors
        background: {
          light: "#ffffff",
          DEFAULT: "#f8fafc",
          dark: "#f1f5f9",
        },
        
        // Text colors
        text: {
          light: "#64748b",
          DEFAULT: "#0f172a",
          dark: "#1e293b",
        },
        
        // Border colors
        border: {
          light: "#f1f5f9",
          DEFAULT: "#e2e8f0",
          dark: "#cbd5e1",
        },
        
        // Success colors
        success: {
          light: "#dcfce7",
          DEFAULT: "#22c55e",
          dark: "#16a34a",
        },
        
        // Warning colors
        warning: {
          light: "#fef3c7",
          DEFAULT: "#f59e0b",
          dark: "#d97706",
        },
        
        // Error colors
        error: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#dc2626",
        },
        
        // Info colors
        info: {
          light: "#dbeafe",
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
        },
        
        // Muted colors (for subtle elements)
        muted: {
          light: "#f9fafb",
          DEFAULT: "#9ca3af",
          dark: "#6b7280",
        },
        
        // Legacy compatibility
        primaryDark: "#4338ca",
        primaryLight: "#6366f1",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
