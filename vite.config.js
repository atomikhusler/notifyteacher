import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Exposes the dev server to your local network for mobile testing
    host: true, 
  }
})
