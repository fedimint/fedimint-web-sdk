import { defineWorkspace, configDefaults } from 'vitest/config'
import wasm from 'vite-plugin-wasm'

export default defineWorkspace([
  {
    plugins: [wasm()],
    test: {
      environment: 'happy-dom',
      browser: {
        enabled: true,
        // name: 'chrome',
        headless: true,
        name: 'chromium',
        provider: 'playwright',
        isolate: true,
        ui: false, // no ui for the core library
      },
    },
  },
])
