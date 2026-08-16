import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  // Relative so the build works wherever it is served from — a GitHub Pages
  // project site (/math-stars/), a custom domain, or a local `vite preview`.
  // An absolute '/' base 404s every asset on a project site.
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
