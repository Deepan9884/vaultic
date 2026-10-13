/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['Georgia', '"Times New Roman"', 'serif'],
        poppins: ['Poppins', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#23233a',
          900: '#2e2c4e',
          800: '#3d3a63',
        },
        brand: {
          50: '#ecebfb',
          100: '#d9d8f7',
          500: '#6c6ce0',
          600: '#5b5bd6',
          700: '#4343a8',
        },
        paper: '#f4f2fa',
        lilac: '#e4e0f2',
      },
      boxShadow: {
        card: '0 1px 2px rgba(46, 44, 78, 0.06)',
        pop: '0 2px 10px rgba(46, 44, 78, 0.10)',
      },
    },
  },
  plugins: [],
};
