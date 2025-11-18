import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['localhost', '.compute.amazonaws.com'],
    port: 5173,
    cors: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['localhost', '.compute.amazonaws.com'],
    cors: true
  },
  // build: {
  //   rollupOptions: {
  //     output: {
  //       // Keep original file names without hashing
  //       assetFileNames: "[name][extname]",
  //       chunkFileNames: "[name].js",
  //       entryFileNames: "[name].js",
  //     }
  //   }
  // }
})
