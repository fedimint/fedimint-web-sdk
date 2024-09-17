import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    topLevelAwait(),
    wasm(), // Required for wasm support
    react(),
  ],
  optimizeDeps: {
    exclude: ['@fedimint/core-web'], // Required for wasm support
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
  build: {
    target: 'esnext',
  },
  // resolve: {
  //   alias: {
  //     '@fedimint/core-web': '../../packages/core-web/src',
  //   },
  // },
})
