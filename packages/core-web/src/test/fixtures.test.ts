import { expect } from 'vitest'
import { walletTest } from './fixtures'

walletTest('Fund wallet 1', async ({ fundedWallet }) => {
  expect(fundedWallet).toBeDefined()
})

walletTest.skip('Fund wallet 2', async ({ fundedWallet }) => {
  expect(fundedWallet).toBeDefined()
})

walletTest.skip('Fund wallet 3', async ({ fundedWallet }) => {
  expect(fundedWallet).toBeDefined()
})

walletTest.skip('Fund wallet 4', async ({ fundedWallet }) => {
  expect(fundedWallet).toBeDefined()
})
