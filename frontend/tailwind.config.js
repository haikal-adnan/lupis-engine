/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UBAH 'bg' JADI 'background'
        background: 'var(--bg-app)', 
        panel: 'var(--bg-panel)',
        element: 'var(--bg-element)',
        'element-hover': 'var(--bg-element-hover)',
        canvas: 'var(--bg-canvas)',
        
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        
        border: 'var(--border-base)',
        action: 'var(--action-active)',
        'action-text': 'var(--action-text)',
      }
    },
  },
  plugins: [],
}