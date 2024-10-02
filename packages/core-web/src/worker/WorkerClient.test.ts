import { expect } from 'vitest'
import { workerTest } from '../test/setupTests'

workerTest('should initialize', async ({ workerClient }) => {
  expect(workerClient).toBeDefined()
})
