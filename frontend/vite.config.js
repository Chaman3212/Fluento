import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { charts: ['recharts'], vendor: ['react', 'react-dom', 'react-router-dom'] } } }, chunkSizeWarningLimit: 450 },
  server: { port: 5173, proxy: { '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:4000', changeOrigin: true } } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js' },
});
