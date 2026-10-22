import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dairy: {
          navy: {
            DEFAULT: '#2F4156',
            hover: '#243344',
            light: '#3a5068',
            dark: '#1d2937',
          },
          teal: {
            DEFAULT: '#567C8D',
            hover: '#486877',
            light: '#6d91a1',
            muted: '#8ba6b4',
          },
          sky: {
            DEFAULT: '#C8D9E6',
            hover: '#b5ccdc',
            light: '#e1ebf3',
            border: '#afc4d4',
          },
          beige: {
            DEFAULT: '#F5EFEB',
            hover: '#ede3dc',
            light: '#faf7f5',
            dark: '#e6dbd3',
          },
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
