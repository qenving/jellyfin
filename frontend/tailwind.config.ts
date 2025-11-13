import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        anime: {
          dark: '#0a0a0a',
          darker: '#050505',
          purple: {
            light: '#c084fc',
            DEFAULT: '#a855f7',
            dark: '#7e22ce',
          },
          blue: {
            light: '#60a5fa',
            DEFAULT: '#3b82f6',
            dark: '#1e40af',
          },
          pink: {
            light: '#f9a8d4',
            DEFAULT: '#ec4899',
            dark: '#be185d',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-anime': 'linear-gradient(to bottom right, #a855f7, #ec4899, #3b82f6)',
        'gradient-dark': 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.7))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
