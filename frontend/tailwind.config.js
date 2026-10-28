/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        argon: {
          primary: "#5e72e4",
          secondary: "#825ee4",
          success: "#2dce89",
          info: "#11cdef",
          warning: "#fb6340",
          danger: "#f5365c",
          dark: "#172b4d",
          light: "#f8f9fe"
        }
      }
    },
  },
  plugins: [],
}

