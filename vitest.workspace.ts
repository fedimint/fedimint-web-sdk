import { defineWorkspace } from 'vitest/config'
import wasm from 'vite-plugin-wasm'

export default defineWorkspace([
  {
    plugins: [wasm()],
    test: {
      environment: 'happy-dom',
      name: 'core',
      include: ['packages/core-web/**/*.test.ts'],
      exclude: ['packages/create-fedimint-app/**/*.test.ts'],
      browser: {
        enabled: true,
        headless: true,
        // name: 'chrome',
        name: 'chromium',
        provider: 'playwright',
        ui: false, // no ui for the core library
        api: {
          port: 63315,
        },
        screenshotFailures: false,
      },
    },
  },
  {
    test: {
      name: 'cli',
      environment: 'happy-dom',
      include: ['packages/create-fedimint-app/__tests__/*.test.ts'],
      exclude: ['packages/create-fedimint-app/__tests__/subfolder'],
      isolate: true,
      testTimeout: 20000,
    },
  },
])
