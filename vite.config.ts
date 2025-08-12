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
    strictPort: false, // Allow fallback ports to avoid conflicts
    // Enable HMR with better performance
    hmr: {
      port: 3001,
      overlay: false, // Disable error overlay for better performance
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0', // Listen on all network interfaces for scalability
    strictPort: false, // Allow fallback ports
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
          ui: ['lucide-react', 'react-hot-toast'],
        },
        // Optimize chunk names for production
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Disable source maps in production for security and performance
    sourcemap: process.env.NODE_ENV !== 'production',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
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
