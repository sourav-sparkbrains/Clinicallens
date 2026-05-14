/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
          800: '#1E2937',
        },
        sky: {
          500: '#0EA5E9',
          600: '#0284C8',
          700: '#0369A1',
        },
        accent: {
          500: '#0EA5E9',
        }
      }
    }
  }
}