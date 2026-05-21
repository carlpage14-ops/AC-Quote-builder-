/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './src/**/*.{js,css}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F5F7FA',
          100: '#E4E9F2',
          200: '#C6D0E0',
          300: '#94A3B8',
          400: '#5F7290',
          500: '#3B4A66',
          600: '#27344C',
          700: '#1A2438',
          800: '#101827',
          900: '#0A1120',
          950: '#050912',
        },
        brand: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        signal: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(6, 182, 212, 0.25), 0 12px 40px -12px rgba(6, 182, 212, 0.45)',
        ring: '0 0 0 1px rgba(255,255,255,0.08), 0 30px 60px -20px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        radial: 'radial-gradient(800px 400px at 20% 0%, rgba(6,182,212,0.25), transparent 60%), radial-gradient(700px 500px at 100% 30%, rgba(14,116,144,0.25), transparent 60%)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shine: 'shine 3s linear infinite',
      },
    },
  },
  plugins: [],
};
