/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pink: {
          light: "#e28d9b",
          DEFAULT: "#ffd1d9",
        },
        beige: {
          light: "#fae5c4",
        },
        brown: {
          light: "#96755f",
          dark: "#411e12",
        },
      },
    },
  },
  plugins: [],
};
