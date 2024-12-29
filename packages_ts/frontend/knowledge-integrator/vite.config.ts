import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Changed from react-swc as discussed
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@relica/fact-search-ui": resolve(
        __dirname,
        "../components/fact-search-ui/dist/index.js"
      ),
      "@relica/constants": resolve(
        __dirname,
        "../../libs/constants/dist/constants.js"
      ),
      "@relica/types": resolve(__dirname, "../../libs/types/dist/index.js"),
      "@relica/3d-graph-ui": resolve(
        __dirname,
        "../components/3d-graph-ui/dist/3d-graph-ui.js"
      ),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    include: [
      "@relica/fact-search-ui",
      "@relica/constants",
      "@relica/types",
      "@relica/3d-graph-ui",
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});
