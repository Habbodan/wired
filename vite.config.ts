import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: 'client',
  publicDir: 'public',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fromRoot('./client/src'),
      '@shared': fromRoot('./shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
  build: {
    outDir: fromRoot('./dist/client'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          vendor: ['@tanstack/react-query', 'i18next', 'react-i18next', 'framer-motion', 'zod'],
        },
      },
    },
  },
  test: {
    root: '.',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    environment: 'node',
  },
});
