/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#1F242D',  
        border: 'rgba(255,255,255,0.08)', 
        textbase: '#FFFFFF', 
      },
    },
  },
  plugins: [],
};
