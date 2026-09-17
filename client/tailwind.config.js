/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-water': 'waterFlow 2s linear infinite',
      },
      keyframes: {
        waterFlow: {
          '0%': { transform: 'translateY(0) scaleY(1)' },
          '50%': { transform: 'translateY(5px) scaleY(1.05)' },
          '100%': { transform: 'translateY(0) scaleY(1)' },
        }
      }
    },
  },
  plugins: [],
}
