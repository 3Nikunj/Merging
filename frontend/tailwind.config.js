/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nav: '#071D3A',
        background: '#f7ede2',
        card: '#ffffff',
        accent: '#fbbf24', // yellow
        practice: {
          background: '#F8F3E7',
          surface: '#F9F9F9',
          card: '#FFFFFF',
          muted: '#F3F3F4',
          line: '#C4C6CE',
          ink: '#00030C',
          sidebar: '#071D3A',
          sidebarActive: '#354766',
          text: '#1A1C1C',
          subdued: '#44474D',
          amber: '#FFC55F',
          amberDark: '#755100',
          error: '#BA1A1A',
        },
        orange: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
        },
        blue: {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
        },
        yellow: {
          light: '#fef08a',
          DEFAULT: '#fbbf24',
        },
        green: {
          DEFAULT: '#10b981',
        },
        red: {
          DEFAULT: '#ef4444',
        }
      }
    },
    boxShadow: {
      dashboard: '0 18px 45px rgba(15, 23, 42, 0.08)',
      buddy: '0 18px 35px rgba(125, 87, 0, 0.28)',
    },
  },
  plugins: [],
}
