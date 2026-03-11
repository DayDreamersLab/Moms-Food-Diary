/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        lora: ['Lora', 'Georgia', 'serif'],
        caveat: ['Caveat', 'cursive'],
      },
      colors: {
        cream: '#fdf6ec',
        parchment: '#f5e9d3',
        'warm-white': '#fffaf4',
        'soft-brown': '#c8956c',
        'deep-brown': '#7a4f2e',
        rust: '#b85c2a',
        sage: '#8a9e7a',
        'warm-gray': '#9e8e7e',
        ink: '#3d2b1f',
        'light-ink': '#6b4c36',
        gold: '#d4a853',
      },
    },
  },
  plugins: [],
};
