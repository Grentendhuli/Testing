import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// FORCE CACHE BUST - Unique timestamp in filenames
// Updated: 2026-03-24 10:45 UTC - Fixed scheduler conflicts by bundling framer-motion/react-window with React
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
    target: ['es2020', 'safari14'],
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/entry-${TIMESTAMP}-[hash].js`,
        chunkFileNames: `assets/[name]-${TIMESTAMP}-[hash].js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          return `assets/[name]-${TIMESTAMP}-[hash][extname]`
        },
        // Strategy: Split chunks to keep initial load under 200KB
        // Per web.dev: https://web.dev/optimize-your-javascript-bundle/
        manualChunks(id) {
          // Don't split source files - only node_modules
          if (!id.includes('node_modules')) {
            return null;
          }
          
          // React core - critical and always needed
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor';
          }
          
          // Libraries that access React Scheduler internals MUST bundle with React
          // to avoid "Cannot set properties of undefined (setting 'unstable_now')" errors
          // This happens when these libs load before React's scheduler is initialized
          if (id.includes('framer-motion') || id.includes('react-window')) {
            return 'vendor';
          }
          
          // PDF generation - only when exporting
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf-lib';
          }
          
          // Charts - heavy, only for reports
          if (id.includes('recharts') || id.includes('victory') || id.includes('d3')) {
            return 'charts';
          }
          
          // Error tracking - lazy loaded
          if (id.includes('@sentry') || id.includes('sentry')) {
            return 'sentry';
          }
          
          // Database
          if (id.includes('@supabase') || id.includes('supabase')) {
            return 'supabase';
          }
          
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Stripe
          if (id.includes('@stripe') || id.includes('stripe')) {
            return 'stripe';
          }
          
          // Small UI utilities grouped together
          if (id.includes('class-variance-authority') || 
              id.includes('clsx') || 
              id.includes('tailwind-merge')) {
            return 'ui-core';
          }
          
          // Other utilities
          if (id.includes('dompurify')) {
            return 'utils';
          }
          
          // Everything else from node_modules
          return 'vendor-extras';
        },
      },
    },
    // Warn if chunks exceed 500KB (for debugging)
    chunkSizeWarningLimit: 500,
  },
  esbuild: {
    target: 'es2020',
    // Tree shaking
    treeShaking: true,
  },
  optimizeDeps: {
    // Pre-bundle these for faster dev starts and to ensure proper load order
    // React MUST be pre-bundled before any libraries that depend on it
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'react-window'],
    // Exclude heavy deps from pre-bundling (they'll be lazy loaded)
    exclude: ['jspdf', '@sentry/react', 'lucide-react'],
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(`2.1.0-${TIMESTAMP}`),
    __FORCE_REBUILD__: 'true',
  },
})
