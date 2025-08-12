import { defineConfig } from 'vite'
import { resolve } from 'path'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm()],

  // These worker settings are required
  worker: {
    format: 'es',
    plugins: () => [
      wasm(), // Required for wasm
    ],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@fedimint/lit',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@fedimint/core-web'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          '@fedimint/core-web': '@fedimint/core-web',
        },
      },
    },
    optimizeDeps: {
      exclude: ['@fedimint/core-web'],
    },
  },
})
