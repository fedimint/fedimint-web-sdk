import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['packages/**/*.ts'],
    },
  },
  optimizeDeps: {
    exclude: ['@fedimint/core-web'],
  },
})
