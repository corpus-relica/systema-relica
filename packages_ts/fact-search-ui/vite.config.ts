import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import VitePluginChecker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePluginChecker({ typescript: true })],
  build: {
    lib: {
      entry: "src/index.tsx",
      name: "FactSearch", // Global name for the component
      formats: ["es", "cjs"], // Output formats
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'styled-components', 'grommet', 'mobx'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
  },
});
