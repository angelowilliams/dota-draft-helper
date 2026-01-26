/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        radiant: {
          DEFAULT: '#92A525',
          light: '#B4D84D',
          dark: '#6D7B1A',
        },
        dire: {
          DEFAULT: '#C23C2A',
          light: '#E35440',
          dark: '#8C2B1F',
        },
        dota: {
          bg: {
            primary: '#0F1419',
            secondary: '#1A1F26',
            tertiary: '#252A31',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#B8BFC6',
            muted: '#6B7280',
          },
        },
      },
    },
  },
  plugins: [],
}
