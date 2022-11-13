/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: "var(--maroon)",
        "bright-blue": "var(--bright-blue)",
        orange: "var(--orange)",
        grey: "var(--grey)",
      },
    },
  },
  plugins: [],
};
