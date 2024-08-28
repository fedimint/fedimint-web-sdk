import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
// import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  // resolve: {
  //   alias: {
  //     'fedimint-web': path.resolve(__dirname, '../../packages/fedimint-web'),
  //   },
  // },
  // optimizeDeps: {
  //   exclude: ['fedimint-client-wasm', 'fedimint-client-ts'],
  // },
  plugins: [wasm(), react()],
  worker: {
    format: 'es',
    plugins: () => [wasm()],
  },
})
