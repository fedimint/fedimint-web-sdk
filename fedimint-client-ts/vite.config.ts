import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ include: ["lib"] })],
  resolve: {
    alias: {
      "fedimint-client-wasm": resolve(__dirname, "../fedimint-client-wasm"),
    },
  },
  build: {
    target: "esnext",
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "fedimint-client-ts",
      fileName: "index",
    },

    copyPublicDir: false,
    sourcemap: true,
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  base: "/fedimint-client-ts/",
});
