import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  },
  build: {
    sourcemap: true,
    outDir: 'dist/client'
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
