import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SigmaSocketServer',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'flatbuffers', 
        'ws', 
        'http',
        'node:events', 
        'node:crypto', 
        'node:util',
        'node:http',
        'node:url',
        'node:path',
        'node:fs'
      ],
      output: {
        globals: {
          flatbuffers: 'flatbuffers',
          ws: 'ws',
          http: 'http'
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
