import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration des ports selon l'environnement
const isProduction = process.env.NODE_ENV === 'production'
const apiPort = process.env.VITE_API_PORT || (isProduction ? '3001' : '3000')
const frontendPort = process.env.VITE_FRONTEND_PORT || '5173'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: parseInt(frontendPort),
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true
      }
    }
  }
})
