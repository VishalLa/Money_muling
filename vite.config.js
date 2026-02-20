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
      '/input': 'http://localhost:8000',
      '/show':  'http://localhost:8000',
      '/download': 'http://localhost:8000'
    }
  },
<<<<<<< HEAD
  base: command === 'build' ? "/Money_muling/" : "/",
  build: {
    rollupOptions: {
      input: fileURLToPath(new URL('./index.html', import.meta.url))
    }
  }
}))
=======
  base: command === 'build' ? "/Money_muling/" : "/"
}))
>>>>>>> 8cf47b6849c1d335e34e7017bd9ed48e8894de07
