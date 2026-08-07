/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070a13', // Deep dark blue background
        panel: '#111520',      // Slightly lighter dark blue for panels
        border: '#1f2937',     // Border color
        accent: '#2563eb',     // Blue accent (like the Market tab)
        text: '#f3f4f6',       // White/gray text
        muted: '#9ca3af',      // Muted gray text
        success: '#10b981',    // Green for positive
        danger: '#ef4444',     // Red for negative
        orangeBtn: '#ea580c',  // Orange button from login screen
        warning: '#f59e0b',    // Orange/yellow for warnings/tips
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
};
