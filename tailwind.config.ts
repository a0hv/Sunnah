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
        display: ['"Thmanyah Display"', 'serif'],
        text: ['"Thmanyah Text"', 'serif'],
        sans: ['"Thmanyah Sans"', 'sans-serif'],
        hadith: ['"Lotus Naskh"', 'var(--font-hadith)', 'var(--font-amiri)', 'serif'],
        quran: ['"UthmanicHafs"', 'serif'],
      },
      colors: {
        paper: {
          light: '#F7F4EE',
          dark: '#0F141B',
        },
        surface: {
          light: '#FDFBF7',
          dark: '#161D27',
        },
        charcoal: {
          light: '#121B28',
          dark: '#EAE6DF',
        },
        muted: {
          light: '#5B6470',
          dark: '#9AA3B0',
        },
        emerald: {
          brand: '#9E6B2B',
          'brand-dark': '#D4A359',
        },
        gold: {
          accent: '#9E6B2B',
          'accent-dark': '#D4A359',
        },
        subtle: {
          light: '#E3DDD1',
          dark: '#242E3C',
        },
        bronze: {
          DEFAULT: '#9E6B2B',
          dark: '#D4A359',
        },
        navy: {
          DEFAULT: '#121B28',
          dark: '#0F141B',
          surface: '#161D27',
        },
      },
    },
  },
  plugins: [],
};

export default config;
