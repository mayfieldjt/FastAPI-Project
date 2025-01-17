import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      external: ["plotly.js"], 
    },
  },
  optimizeDeps: {
    include: ["plotly.js-basic-dist"], 
  },
})
