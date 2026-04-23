/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09110e",
        carbon: "#101816",
        ember: "#b95f32",
        limeflash: "#c8ff6a",
        mist: "#d9ddd6",
      },
      boxShadow: {
        glow: "0 0 120px rgba(200, 255, 106, 0.16)",
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', "serif"],
        body: ['"Trebuchet MS"', '"Segoe UI"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
