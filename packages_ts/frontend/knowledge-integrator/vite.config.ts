import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  root: "/usr/src/app/packages_ts/frontend/knowledge-integrator",
  plugins: [react()],
  resolve: {
    alias: {
      "@relica/fact-search-ui": resolve(
        __dirname,
        "../components/fact-search-ui/src/index.tsx"
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
      "@relica/fact-search-ui/src": resolve(
        __dirname,
        "../components/fact-search-ui/src"
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
    exclude: [
      "@relica/fact-search-ui",
      "@relica/constants",
      "@relica/types",
      "@relica/3d-graph-ui",
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      exclude: [
        "@relica/fact-search-ui",
        "@relica/constants",
        "@relica/types",
        "@relica/3d-graph-ui",
      ],
    },
    rollupOptions: {
      input: {
        app: resolve(__dirname, "index.html"),
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
