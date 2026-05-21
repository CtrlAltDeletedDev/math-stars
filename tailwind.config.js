/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        star:     '#FFD700',
        correct:  '#4CAF50',
        wrong:    '#FF5252',
        sky:      '#87CEEB',
        coral:    '#FF6B6B',
        mint:     '#5DD97A',
        lavender: '#C77DFF',
        ocean:    '#4FC3F7',
      },
      fontFamily: {
        'nunito':       ['Nunito-Regular'],
        'nunito-bold':  ['Nunito-Bold'],
        'nunito-extra': ['Nunito-ExtraBold'],
      },
    },
  },
  plugins: [],
};
