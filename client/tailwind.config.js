/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'serif'],
      },
      colors: {
        background: '#FAF7F0',
        surface: '#FFFFFF',
        'surface-soft': '#F4EFE2',
        border: '#E7E1D2',
        primary: {
          50: '#FBF4E4',
          100: '#F5E7C4',
          200: '#EACD8C',
          300: '#DEB35E',
          400: '#C99A3E',
          500: '#9A7720',
          600: '#83641A',
          700: '#6B5115',
          800: '#533F10',
          900: '#3B2D0B',
        },
        text: {
          primary: '#1F1D18',
          secondary: '#6B675C',
          muted: '#A9A497',
        },
        success: '#5C7A3D',
        warning: '#C2760C',
        danger: '#B3432B',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(31 29 24 / 0.04), 0 1px 3px 0 rgb(31 29 24 / 0.06)',
        soft: '0 4px 16px -4px rgb(31 29 24 / 0.08), 0 2px 6px -2px rgb(31 29 24 / 0.05)',
        glow: '0 8px 24px -6px rgb(154 119 32 / 0.35)',
      },
      keyframes: {
        blobDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(4%, -6%) scale(1.08)' },
          '66%': { transform: 'translate(-3%, 4%) scale(0.96)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        blob: 'blobDrift 18s ease-in-out infinite',
        'blob-slow': 'blobDrift 26s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
