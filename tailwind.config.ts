/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        calcifer: {
          orange: '#f97316',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
