import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// FORCE CACHE BUST - Unique timestamp in filenames
const TIMESTAMP = 'b91c19787b1ed2'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/context': path.resolve(__dirname, './src/context'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/features': path.resolve(__dirname, './src/features'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${TIMESTAMP}-[hash].js`,
        chunkFileNames: `assets/[name]-${TIMESTAMP}-[hash].js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          return `assets/[name]-${TIMESTAMP}-[hash][extname]`
        },
        manualChunks(id) {
          // Vendor chunking from node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-react'; // Bundle with react to avoid scheduler issues
            }
            if (id.includes('@supabase')) {
              return 'vendor-db';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@stripe')) {
              return 'vendor-stripe';
            }
            return 'vendor-other';
          }
          
          // Source file chunking - let React.lazy handle page chunks naturally
          // Other source files will be in their appropriate chunk or the main chunk
          return null;
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(`2.1.0-${TIMESTAMP}`),
  },
})
