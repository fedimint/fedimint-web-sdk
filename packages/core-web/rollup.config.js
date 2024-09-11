/** @type {import('rollup').RollupOptions} */
import typescript from '@rollup/plugin-typescript'
import { wasm } from '@rollup/plugin-wasm'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import terser from '@rollup/plugin-terser'

export default {
  input: {
    index: 'src/index.ts',
  },
  output: [
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      sourceMap: true,
      inlineSources: true,
    }),
    wasm({
      maxFileSize: 0,
    }),
    importMetaAssets(),
    terser(),
  ],
}
