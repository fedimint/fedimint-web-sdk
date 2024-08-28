import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
// import dts from "vite-plugin-dts";
// import wasmPack from "vite-plugin-wasm-pack";

export default defineConfig({
  plugins: [
    // wasmPack([resolve(__dirname, "./node_modules/fedimint-client-wasm")]),
    // dts({ include: ["lib"] }),
    wasm(),
  ],
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    target: ['esnext'],
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'fedimint-web',
      // formats: ["es"],
      //   // entry: "lib/index.ts",
      //   // name: "@fedimint/fedimint-client-ts",
      //   // fileName: "index",
    },
    // outDir: "dist/esm",
    emptyOutDir: false,
    // copyPublicDir: false,
    // sourcemap: true,
    // minify: false,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  worker: {
    format: 'es',
    plugins: () => [wasm()],
  },
})
