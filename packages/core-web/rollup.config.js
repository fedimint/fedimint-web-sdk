/** @type {import('rollup').RollupOptions} */
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import { dts } from 'rollup-plugin-dts'

export default [
  {
    input: { worker: 'src/worker/worker.js', index: 'src/index.ts' },
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      assetFileNames: '[name].[ext]',
      sourcemap: true,
    },
    plugins: [typescript(), terser()],
    external: ['@fedimint/fedimint-client-wasm-bundler'],
  },
  {
    input: './dist/dts/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
]
