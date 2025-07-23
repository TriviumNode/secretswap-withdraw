import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // You can specify which Node.js globals to polyfill
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // You can also specify which Node.js modules to include/exclude
      include: ['buffer'],
      // exclude: [], // Exclude other modules if needed
    }),
  ],
})
