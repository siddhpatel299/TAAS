/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#0088cc',
          light: '#54a9eb',
          dark: '#006699',
        },
      },
    },
  },
  plugins: [],
};
