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
          light: "#f9c2cb",
          DEFAULT: "#e28d9b",
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
