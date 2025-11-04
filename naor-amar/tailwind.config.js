/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b4513',
        secondary: '#16213e',
        accent: '#0f3460',
        background: '#0f0f23',
        surface: '#1a1a2e',
        card: '#16213e',
        neonBlue: '#00d4ff',
        neonGreen: '#00ff88',
        neonPurple: '#8b5cf6',
        neonPink: '#ec4899',
        barberGold: '#ffd700',
      },
      fontFamily: {
        heebo: ['Heebo'],
        playfair: ['Playfair Display'],
      },
    },
  },
  plugins: [],
}

