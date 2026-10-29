import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs on a separate Express server (server/dev.js).
// The proxy makes `/api/*` same-origin for the browser, exactly like on Vercel.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
