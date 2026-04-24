import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const apiTarget = process.env.VITE_API_TARGET || 'https://localhost:3000';

function loadHttpsOptions() {
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;
  if (!keyPath || !certPath) return false;
  try {
    const keyStat = fs.statSync(keyPath);
    const certStat = fs.statSync(certPath);
    if (!keyStat.isFile() || !certStat.isFile()) return false;
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  } catch {
    return false;
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    https: loadHttpsOptions(),
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
