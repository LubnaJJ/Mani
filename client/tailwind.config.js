/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF8F5',
        ink: '#1C1C1A',
        'ink-2': '#6B6760',
        'ink-3': '#A8A49F',
        accent: '#D4A5A5',
        'accent-dark': '#B08080',
        sage: '#8FA68E',
        surface: '#F0EDE8',
        border: '#E2DDD8',
      },
      fontFamily: {
        display: ['Shippori Mincho', 'serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
