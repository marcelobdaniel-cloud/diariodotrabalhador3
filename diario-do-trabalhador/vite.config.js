import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Celular-Piso (§2.4): bundle mínimo, sem sourcemaps em produção, alvo ES2017
// (Android 8 / Chrome antigo).
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2017',
    sourcemap: false,
    chunkSizeWarningLimit: 600
  }
})
