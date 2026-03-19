import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// FORCE CACHE BUST - Unique timestamp in filenames
// Updated: 2026-03-12 00:20 UTC
const TIMESTAMP = 'a91c19787b1ed1'

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
    rollupOptions: {
      output: {
        entryFileNames: `assets/entry-${TIMESTAMP}-[hash].js`,
        chunkFileNames: `assets/chunk-${TIMESTAMP}-[hash].js`,
      assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
        return `assets/asset-${TIMESTAMP}-[hash][extname]`
      },
      },
    },
  },
  esbuild: {
 target: 'es2020',
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(`2.1.0-${TIMESTAMP}`),
    __FORCE_REBUILD__: 'true',
  },
})