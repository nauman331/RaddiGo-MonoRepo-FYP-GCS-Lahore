import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// All API traffic goes through the nginx gateway (port 80).
// Make sure Docker is running: bun run docker:dev
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/auth': { target: 'http://100.52.191.87', changeOrigin: true },
      '/wallet': { target: 'http://100.52.191.87', changeOrigin: true },
      '/admin': { target: 'http://100.52.191.87', changeOrigin: true },
      '/category': { target: 'http://100.52.191.87', changeOrigin: true },
      '/order': { target: 'http://100.52.191.87', changeOrigin: true },
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
