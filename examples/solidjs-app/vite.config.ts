/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [solidPlugin(), wasm()],

  server: {
    port: 3000,
  },

  test: {
    globals: true,
    browser: {
      provider: 'playwright',
      enabled: true,
      instances: [{ browser: 'chromium' }],
    },
  },

  build: {
    target: 'esnext',
    sourcemap: true,
  },

  resolve: {
    conditions: ['development', 'browser'],
  },

  worker: {
    format: 'es',
    plugins: () => [wasm()], // Fix: Function that returns the plugin array
  },

  optimizeDeps: {
    exclude: ['@fedimint/core-web'], // Exclude the WASM module if needed
  },
});
