/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1420",
        panel: "#101C2C",
        panel2: "#132133",
        line: "#22334A",
        muted: "#8FA0B5",
        amber: "#E8934A",
        glacier: "#6FA8C9",
        ember: "#D46A3E",
        sage: "#79A88E",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
