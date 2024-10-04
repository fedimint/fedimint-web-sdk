import { expect } from 'vitest'
import { workerTest } from '../test/fixtures'

workerTest('should initialize', async ({ workerClient }) => {
  expect(workerClient).toBeDefined()
})
