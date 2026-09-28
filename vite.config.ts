import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Kapalı devre önizleme ortamlarında (tünelli/iframeli) HMR'ın doğru portu
// kullanması için HMR_CLIENT_PORT verilebilir. Yerelde tanımsızdır.
const hmrClientPort = process.env.HMR_CLIENT_PORT ? Number(process.env.HMR_CLIENT_PORT) : undefined

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Tünel/proxy üzerinden gelen isteklerin Host başlığını kabul et
    allowedHosts: true,
    hmr: hmrClientPort ? { clientPort: hmrClientPort, protocol: 'wss' } : undefined,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
})
