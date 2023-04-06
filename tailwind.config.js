const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      cal: ['Cal Sans', 'Inter var', 'sans-serif'],
    },
    extend: {
      colors: {
        current: 'currentColor',
        brand: {
          50: '#FBE9E9',
          100: '#F8D3D3',
          200: '#F1A7A7',
          300: '#EA7B7B',
          400: '#E35454',
          500: '#DC2727',
          600: '#B41D1D',
          700: '#841515',
          800: '#580E0E',
          900: '#2C0707',
        },
      },
      width: {
        1536: '1536px',
      },
      height: {
        150: '37.5rem',
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        mono: ['Consolas', ...defaultTheme.fontFamily.mono],
      },
      typography: {
        DEFAULT: {
          css: {
            h1: {
              fontFamily: 'Cal Sans',
            },
            h2: {
              fontFamily: 'Cal Sans',
            },
            h3: {
              fontFamily: 'Cal Sans',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
          },
        },
      },
      keyframes: {
        wiggle: {
          '0%, 100%': {
            transform: 'translateX(0%)',
            transformOrigin: '50% 50%',
          },
          '15%': { transform: 'translateX(-6px) rotate(-6deg)' },
          '30%': { transform: 'translateX(9px) rotate(6deg)' },
          '45%': { transform: 'translateX(-9px) rotate(-3.6deg)' },
          '60%': { transform: 'translateX(3px) rotate(2.4deg)' },
          '75%': { transform: 'translateX(-2px) rotate(-1.2deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.8s both',
      },
      textDecorationThickness: {
        3: '3px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
