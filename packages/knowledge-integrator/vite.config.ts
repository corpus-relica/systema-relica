import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': process.env,
    },
    server: {
        host: true,
    },
    base: './',
    esbuild: {
        // Reduce memory usage and prevent service crashes
        target: 'es2020',
        keepNames: false,
        minifyIdentifiers: false,
        minifySyntax: false,
        minifyWhitespace: false,
    },
    optimizeDeps: {
        // Pre-bundle problematic dependencies
        include: ['@mui/icons-material'],
        // Reduce esbuild memory usage
        esbuildOptions: {
            target: 'es2020',
        }
    }
});
