import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@relica/fact-search-ui": resolve(
        __dirname,
        "../fact-search-ui/dist/index.js"
      ),
      "@relica/constants": resolve(__dirname, "../constants/dist/constants.js"),
      "@relica/types": resolve(__dirname, "../types/dist/index.js"),
    },
  },
  server: {
    host: "0.0.0.0", // Important for Docker
    port: 5173,
    watch: {
      usePolling: true, // Important for Docker
    },
  },
  optimizeDeps: {
    include: ["@relica/fact-search-ui", "@relica/constants", "@relica/types"],
  },
});
