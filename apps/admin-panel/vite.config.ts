import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Live API gateway URL
const TARGET = process.env.VITE_PROXY_TARGET || 'http://100.52.191.87';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/auth': { target: TARGET, changeOrigin: true },
      '/wallet': { target: TARGET, changeOrigin: true },
      '/admin': { target: TARGET, changeOrigin: true },
      '/category': { target: TARGET, changeOrigin: true },
      '/order': { target: TARGET, changeOrigin: true },
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
