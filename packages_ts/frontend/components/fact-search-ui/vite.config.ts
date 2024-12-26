import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "FactSearchUI",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    outDir: "dist",
    emptyOutDir: false, // Don't clean out the dist directory on build
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@mui/material",
        "@mui/icons-material",
        "@relica/types",
        "@relica/constants",
        "@tanstack/react-query",
        "lodash.debounce",
        "mobx-react-lite",
        "qs",
        "grommet",
        "grommet-icons",
        "mobx",
        "styled-components",
        "axios",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@relica/types": "RelicaTypes",
          "@relica/constants": "RelicaConstants",
          "@tanstack/react-query": "ReactQuery",
          "lodash.debounce": "debounce",
          "mobx-react-lite": "mobxReactLite",
          mobx: "mobx",
          qs: "Qs",
          grommet: "Grommet",
          "styled-components": "styled",
          axios: "axios",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@relica/constants": resolve(__dirname, "../constants/dist/constants.js"),
      "@relica/types": resolve(__dirname, "../types/dist/index.js"),
    },
  },
  optimizeDeps: {
    include: ["@relica/types", "@relica/constants"],
  },
});
