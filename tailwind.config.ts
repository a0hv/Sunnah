import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
        text: ['var(--font-text)', 'serif'],
        hadith: ['var(--font-hadith)', 'serif'],
        quran: ['var(--font-quran)', 'serif'],
      },
      colors: {
        paper: {
          light: '#FAF9F5',
          dark: '#0E1412',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#151E1B',
        },
        charcoal: {
          light: '#1A1F1C',
          dark: '#EAECE9',
        },
        muted: {
          light: '#526058',
          dark: '#94A39D',
        },
        emerald: {
          brand: '#0F5C4A',
          'brand-dark': '#34A88B',
        },
        gold: {
          accent: '#A67C2E',
          'accent-dark': '#D4AF63',
        },
        subtle: {
          light: '#E6E2D8',
          dark: '#23302B',
        },
      },
    },
  },
  plugins: [],
};

export default config;
