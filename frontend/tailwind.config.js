/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // "font-playfair" → Playfair Display (luxury serif for headings)
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        // "font-inter" → Inter (crisp sans-serif for utility text)
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#0a0f1e',
          900: '#0d1526',
          800: '#162040',
          700: '#1e3060',
        },
        champagne: {
          300: '#fcd89a',
          400: '#f5c05a',
          500: '#e8a820',
        },
      },
      aspectRatio: {
        '4/5': '4 / 5',
        '5/6': '5 / 6',
      },
      animation: {
        'fade-up': 'fadeUp 0.9s cubic-bezier(0.16, 0.84, 0.44, 1) both',
        'fade-up-delay-1': 'fadeUp 0.9s 0.15s cubic-bezier(0.16, 0.84, 0.44, 1) both',
        'fade-up-delay-2': 'fadeUp 0.9s 0.30s cubic-bezier(0.16, 0.84, 0.44, 1) both',
        'fade-up-delay-3': 'fadeUp 0.9s 0.45s cubic-bezier(0.16, 0.84, 0.44, 1) both',
        'marquee': 'marquee 35s linear infinite',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(1.4)' },
        },
      },
    },
  },
  plugins: [],
}