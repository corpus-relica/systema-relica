import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'FactSearchUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/icons-material',
        '@relica/types',
        '@relica/constants'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@relica/types': 'RelicaTypes',
          '@relica/constants': 'RelicaConstants'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@relica/constants': resolve(__dirname, '../constants/dist/constants.js'),
      '@relica/types': resolve(__dirname, '../types/dist/index.js')
    }
  }
});
