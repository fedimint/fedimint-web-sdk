/** @type {import('rollup').RollupOptions} */
import typescript from '@rollup/plugin-typescript'

import terser from '@rollup/plugin-terser'

export default [
  {
    input: { worker: 'src/worker.js', index: 'src/index.ts' },
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      assetFileNames: '[name].[ext]',
    },
    plugins: [typescript(), terser()],
  },
]
