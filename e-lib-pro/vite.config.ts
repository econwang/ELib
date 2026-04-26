import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    dedupe: ['vue'],
    alias: {
      'splitpanes/dist/splitpanes.css': path.resolve(__dirname, 'node_modules/splitpanes/dist/splitpanes.css'),
      'splitpanes': path.resolve(__dirname, 'node_modules/splitpanes/dist/splitpanes.es.js')
    }
  },
  build: {
    rollupOptions: {
      external: []
    }
  }
})
