import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '^/api/account/(login|register)$': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
