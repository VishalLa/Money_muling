import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/input': 'https://money-muling-jtzq.onrender.com/',
      '/show':  'https://money-muling-jtzq.onrender.com/',
      '/download': 'https://money-muling-jtzq.onrender.com/'
    }
  },
  base: command === 'build' ? "/Money_muling/" : "/"
}))
