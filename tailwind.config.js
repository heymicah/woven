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
          light: "#F9C2CB",
          DEFAULT: "#E28D9B",
          dark: "#D4707F",
        },
        beige: {
          light: "#FAE5C4",
          DEFAULT: "#C4A686",
          surface: "#FFF8F0",
        },
        brown: {
          lightest: "#96755F",
          light: "#674438",
          DEFAULT: "#543125",
          dark: "#411E12",
        },
      },
    },
  },
  plugins: [],
};
