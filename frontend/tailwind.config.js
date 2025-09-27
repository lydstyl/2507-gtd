/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px', // Full HD+ for 8 columns on 4K screens
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}
