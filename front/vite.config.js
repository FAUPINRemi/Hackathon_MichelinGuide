import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const apiTarget = process.env.VITE_API_TARGET || 'https://localhost:3000';

const keyPath = process.env.SSL_KEY_PATH;
const certPath = process.env.SSL_CERT_PATH;
const httpsOptions =
  keyPath && certPath
    ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
    : false;

export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsOptions,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
