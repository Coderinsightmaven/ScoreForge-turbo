/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
    "./providers/**/*.{js,ts,tsx}",
    "./hooks/**/*.{js,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        display: ["ClashDisplay-Regular"],
        "display-medium": ["ClashDisplay-Medium"],
        "display-semibold": ["ClashDisplay-Semibold"],
        "display-bold": ["ClashDisplay-Bold"],
        sans: ["DMSans-Regular"],
        "sans-medium": ["DMSans-Medium"],
        "sans-semibold": ["DMSans-SemiBold"],
        "sans-bold": ["DMSans-Bold"],
      },
      colors: {
        brand: {
          DEFAULT: "#2F6BFF",
          hover: "#2557D6",
          light: "#E8EEFF",
          text: "#1E3A8A",
          dark: "#4D7DFF",
          glow: "#8EB0FF",
        },
        surface: {
          primary: "#FFFFFF",
          secondary: "#F3F6FD",
          tertiary: "#E9EEF8",
        },
        "text-primary": "#0F1B33",
        "text-secondary": "#3A4A68",
        "text-tertiary": "#6D7F9F",
        "text-inverse": "#F8FAFF",
        status: {
          live: {
            bg: "#FFE8EC",
            text: "#B4234A",
            border: "#E84C7A",
          },
          active: {
            bg: "#EAF8F1",
            text: "#1D7A4D",
            border: "#32A36B",
          },
          pending: {
            bg: "#EFF3FA",
            text: "#526486",
            border: "#7A8FB3",
          },
          completed: {
            bg: "#EAF1FF",
            text: "#285ACB",
            border: "#4A78E8",
          },
        },
        dark: {
          bg: "#0E1525",
          card: "#141E33",
          elevated: "#1D2A44",
        },
        slate: {
          50: "#F4F7FF",
          100: "#EAF0FC",
          200: "#D6E0F2",
          300: "#B7C7E3",
          400: "#8FA3C7",
          500: "#6780A8",
          600: "#4C678E",
          700: "#384F73",
          800: "#243854",
          900: "#182842",
          950: "#0D172A",
        },
      },
    },
  },
  plugins: [],
};
