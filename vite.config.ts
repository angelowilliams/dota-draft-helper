import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/db': path.resolve(__dirname, './src/db'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
  server: {
    proxy: {
      '/api/ad2l': {
        target: 'https://dota.playon.gg',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ad2l/, ''),
      },
    },
  },
})
