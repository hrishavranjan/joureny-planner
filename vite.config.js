import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // For local dev only (not used on Vercel)
    historyApiFallback: true
  },
  // ✅ This is needed for Vercel to know build output
  build: {
    outDir: 'dist',
  }
});
