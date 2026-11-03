import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // In development the client calls /api and Vite forwards it to the Express server.
      proxy: { '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:5000', changeOrigin: true } },
    },
  };
});
