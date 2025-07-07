import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Use HTTP for development to avoid SSL issues
    https: false,
    port: 5176,
    host: '0.0.0.0', // Listen on all network interfaces for scalability
    strictPort: true,
    // Enable HMR with better performance
    hmr: {
      port: 5176,
      overlay: false, // Disable error overlay for better performance
    },
  },
  preview: {
    port: 5176,
    host: '0.0.0.0', // Listen on all network interfaces for scalability
    strictPort: true,
  },
  build: {
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Better code splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    // Enable source maps for debugging
    sourcemap: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'recharts',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
    ],
  },
})
