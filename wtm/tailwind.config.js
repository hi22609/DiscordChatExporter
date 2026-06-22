/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          DEFAULT: '#FF6B35',
          50: '#FFF3EE',
          100: '#FFE4D6',
          200: '#FFC5A8',
          300: '#FFA07A',
          400: '#FF7D4D',
          500: '#FF6B35',
          600: '#E84E14',
          700: '#C23A0C',
          800: '#9B2E09',
          900: '#7A2508',
        },
        // Dark theme neutrals
        surface: {
          DEFAULT: '#141414',
          50: '#1E1E1E',
          100: '#252525',
          200: '#2E2E2E',
          300: '#383838',
          400: '#424242',
        },
        // Text
        ink: {
          DEFAULT: '#FAFAFA',
          muted: '#A0A0A0',
          subtle: '#606060',
        },
        // Status colors
        success: '#22C55E',
        warning: '#EAB308',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
        black: ['Inter_900Black', 'System'],
      },
      spacing: {
        safe: '34px',
      },
    },
  },
  plugins: [],
};
