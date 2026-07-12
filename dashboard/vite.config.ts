import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = 'http://localhost:8080'
const apiPaths = ['/auth', '/me', '/media', '/rules', '/healthz', '/webhooks', '/config']

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: ['.ngrok-free.dev', 'localhost'],
    proxy: Object.fromEntries(
      apiPaths.map((path) => [path, { target: apiTarget, changeOrigin: true }]),
    ),
  },
})
