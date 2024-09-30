import { defineWorkspace } from 'vitest/config'
import wasm from 'vite-plugin-wasm'

export default defineWorkspace([
  {
    plugins: [wasm()],
    test: {
      environment: 'happy-dom',
      browser: {
        enabled: true,
        headless: true,
        // name: 'chrome',
        name: 'chromium',
        provider: 'playwright',
        isolate: true,
        ui: false, // no ui for the core library
        api: {
          port: 63315,
        },
        screenshotFailures: false,
      },
    },
  },
])
