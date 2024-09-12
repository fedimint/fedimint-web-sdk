/** @type {import('rollup').RollupOptions} */
import typescript from '@rollup/plugin-typescript'
import { wasm } from '@rollup/plugin-wasm'
import terser from '@rollup/plugin-terser'

export default [
  {
    input: { worker: 'src/wasm.worker.js' },
    output: [
      {
        dir: 'dist',
        format: 'es',
      },
    ],
    plugins: [
      wasm({
        maxFileSize: 0,
      }),
      terser(),
    ],
  },
  {
    input: { index: 'src/index.ts' },
    output: [
      {
        dir: 'dist',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        sourceMap: true,
        inlineSources: true,
      }),
      terser(),
    ],
  },
]
