import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import VitePluginChecker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePluginChecker({ typescript: true })],
  build: {
    lib: {
      entry: "src/App.tsx",
      name: "BinaryFactUI", // Global name for the component
      formats: ["es", "cjs"], // Output formats
    },
    rollupOptions: {
      external: ["react", "react-dom"], // Marking peer dependencies as external
    },
  },
});
