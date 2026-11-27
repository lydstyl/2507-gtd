/** @type {import('tailwindcss').Config} */

// Palette pilotée par variables CSS pour le mode sombre (darkMode: 'class').
// Valeurs claires/sombres définies dans src/index.css.
const varScale = (name) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => [
      String(s),
      `rgb(var(--c-${name}-${s}) / <alpha-value>)`,
    ])
  );

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        '3xl': '1920px', // Full HD+ for 8 columns on 4K screens
      },
      colors: {
        gray: varScale('gray'),
        blue: varScale('blue'),
        red: varScale('red'),
        green: varScale('green'),
        yellow: varScale('yellow'),
        purple: varScale('purple'),
        orange: varScale('orange'),
        amber: varScale('amber'),
        // indigo : statuts « IA en cours » (TaskCategoryService) — la palette
        // n'était pas pilotée par variables, d'où un fond indigo-50 clair
        // illisible en mode sombre (27/11/2026).
        indigo: varScale('indigo'),
      },
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}
