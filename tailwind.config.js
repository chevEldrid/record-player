/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        appBg: '#FFBD59',
        appBgElevated: '#FFF9F2',
        appCard: '#FFFDF9',
        appCardAlt: '#F3E7D6',
        appBorder: '#E6D6C3',
        appText: '#211A14',
        appMuted: '#7B6A5A',
        appAccent: '#C96B4B',
        appAccentSoft: '#F1D4C6',
        appDanger: '#D33A2C',
      },
      borderRadius: {
        appSm: '10px',
        appMd: '16px',
        appLg: '24px',
        appPill: '999px',
      },
      boxShadow: {
        app: '0 8px 16px rgba(43, 25, 10, 0.08)',
      },
    },
  },
  plugins: [],
};
