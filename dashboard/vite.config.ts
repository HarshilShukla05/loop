import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = 'http://localhost:8080'
const apiPaths = ['/auth', '/me', '/healthz', '/webhooks']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['.ngrok-free.dev', 'localhost'],
    proxy: Object.fromEntries(
      apiPaths.map((path) => [path, { target: apiTarget, changeOrigin: true }]),
    ),
  },
})
