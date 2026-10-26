import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib', 'tesseract.js', 'docx', 'xlsx', 'jszip', 'canvas-confetti'],
  },
});
