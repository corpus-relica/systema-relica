import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// Remove the absolute Docker path and let Vite use the current directory
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    preserveSymlinks: true,
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
    port: 5173,
  },
  // server: {
  //   host: "0.0.0.0",
  //   port: 5173,
  //   watch: {
  //     usePolling: true,
  //   },
  // },
  optimizeDeps: {
    include: ["react", "react-dom"],
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
