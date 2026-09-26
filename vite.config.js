import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the build runs from any static host or subfolder (itch.io, Netlify, Vercel).
export default defineConfig({
  plugins: [react()],
  base: './',
})
