/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./app/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      karla: ["Karla", "sans-serif"],
    },
    extend: {
      colors: {
        maroon: "var(--maroon)",
        "brighter-purple": "var(--brighter-purple)",
        "bright-purple": "var(--bright-purple)",
        purple: "var(--purple)",
        "dark-blue": "var(--dark-blue)",
        grey: "var(--grey)",
        divider: "var(--divider)",
        "white-85-opacity": "var(--white-85-opacity)",
      },
      gridTemplateColumns: {
        "match-card": "var(--grid-match-card)",
        "match-form-card": "var(--grid-match-form-card)",
      },
    },
  },
  plugins: [],
};
