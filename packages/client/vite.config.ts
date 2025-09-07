import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SigmaSocketClient',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['flatbuffers'],
      output: {
        globals: {
          flatbuffers: 'flatbuffers'
        }
      }
    },
    sourcemap: true,
    minify: false
  },
  test: {
    globals: true,
    environment: 'node'
  }
})
