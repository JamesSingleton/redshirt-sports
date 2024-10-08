import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: ['./components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      typography: {
        DEFAULT: {
          css: {
            // use next/font variable to override h1
            h1: {
              fontFamily: 'var(--font-sans)',
            },
            h2: {
              fontFamily: 'var(--font-sans)',
            },
            h3: {
              fontFamily: 'var(--font-sans)',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
          },
        },
      },
      gridTemplateAreas: {
        header: ['current player player position last new'],
        row: ['current avatar details position status status'],
        status: ['last arrow new'],
        'row-xs': [
          'current current current',
          'avatar details .',
          'position details .',
          'position . .',
          'status status status',
        ],
        'row-sm': [
          'current current current',
          'avatar details status',
          'position details status',
          'position . .',
        ],
      },
      gridTemplateColumns: {
        header: '120px 110px 1.5fr .5fr 1fr 1fr',
        row: '120px 110px 1.5fr .5fr 1fr 1fr',
        status: '.5fr .5fr 1fr',
        'row-xs': '70px 1fr',
        'status-xs': 'repeat(2,30px) auto',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    require('@savvywombat/tailwindcss-grid-areas'),
  ],
  variants: {
    gridTemplateAreas: ['responsive'],
  },
} satisfies Config

export default config
