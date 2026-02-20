import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/input': 'http://localhost:8000',
      '/show':  'http://localhost:8000',
      '/download': 'http://localhost:8000'
    }
  },
  base: "/Money_muling/"
})
