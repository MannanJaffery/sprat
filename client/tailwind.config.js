/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#F7F8FA',
        surface: '#FFFFFF',
        border: '#E2E5EA',
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4C63EC',
          600: '#2954E5',
          700: '#1E3FC7',
          800: '#1A2F9E',
          900: '#182B7D',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
