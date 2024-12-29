import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/App.tsx'),
      name: '3DGraphUI',
      formats: ['es', 'umd'],
      fileName: (format) => `3d-graph-ui.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          three: 'THREE',
          '@react-three/fiber': 'ReactThreeFiber',
          '@react-three/drei': 'Drei'
        }
      }
    }
  }
});
