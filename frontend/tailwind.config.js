/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-once': {
          '0%':   { transform: 'rotate(0deg)'   },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(99,102,241,.4)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(99,102,241,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0)'  },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)'   },
          '50%':      { transform: 'translateY(-6px)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up':        'fade-up .4s cubic-bezier(.16,1,.3,1) both',
        'fade-in':        'fade-in .3s ease both',
        'scale-in':       'scale-in .25s cubic-bezier(.16,1,.3,1) both',
        'slide-in-right': 'slide-in-right .35s cubic-bezier(.16,1,.3,1) both',
        'slide-in-left':  'slide-in-left .35s cubic-bezier(.16,1,.3,1) both',
        shimmer:          'shimmer 2s linear infinite',
        'spin-once':      'spin-once .5s ease',
        'pulse-ring':     'pulse-ring 1.5s ease infinite',
        float:            'float 3s ease-in-out infinite',
        'float-delayed':  'float 3s ease-in-out 1.6s infinite',
        marquee:          'marquee 32s linear infinite',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(99,102,241,.35)',
        'glow-sm':      '0 0 10px rgba(99,102,241,.2)',
        'card-dark':    '0 1px 3px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.3)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'grid-dark':        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0zM40 0h1v40h-1zM0 0h40v1H0zM0 40h40v1H0z' fill='rgba(99,102,241,.06)'/%3E%3C/svg%3E\")",
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [],
};
