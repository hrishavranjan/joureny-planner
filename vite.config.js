import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    // ✅ Enable history fallback so Vite handles all routes
    historyApiFallback: true,
  }
});
