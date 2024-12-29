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
        "@mui/icons-material", // Add this
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
          "@mui/material": "MaterialUI",
          "@mui/icons-material": "MaterialIcons", // Add this
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
      "@relica/constants": resolve(
        __dirname,
        "../../../libs/constants/dist/constants.js"
      ),
      "@relica/types": resolve(__dirname, "../../../libs/types/dist/index.js"),
      alias: {
        "@mui/material": resolve(
          __dirname,
          "../../../../node_modules/@mui/material"
        ),
        "@mui/icons-material": resolve(
          __dirname,
          "../../../../node_modules/@mui/icons-material"
        ),
      },
    },
  },
  optimizeDeps: {
    include: ["@relica/types", "@relica/constants"],
  },
});
