import { expect, test } from 'vitest'
import { TestFedimintWallet } from './TestFedimintWallet'
import { TransportClient } from '../transport/TransportClient'

/**
 * Adds Fixtures for setting up and tearing down a test FedimintWallet instance
 */
export const walletTest = test.extend<{
  wallet: TestFedimintWallet
  fundedWallet: TestFedimintWallet
  fundedWalletBeefy: TestFedimintWallet
  unopenedWallet: TestFedimintWallet
}>({
  wallet: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    const wallet = new TestFedimintWallet()
    expect(wallet).toBeDefined()
    const inviteCode = await wallet.testing.getInviteCode()
    await expect(
      wallet.joinFederation(inviteCode, randomTestingId),
    ).resolves.toBe(true)

    await use(wallet)

    // clear up browser resources
    await wallet.cleanup()

    // remove the wallet db
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(randomTestingId)
      request.onsuccess = resolve
      request.onerror = resolve
      request.onblocked = resolve
    })
  },

  fundedWallet: async ({ wallet }, use) => {
    // 10K MSats
    await wallet.fundWallet(10_000)
    await use(wallet)
  },
  fundedWalletBeefy: async ({ wallet }, use) => {
    // 1M MSats
    await wallet.fundWallet(1_000_000)
    await use(wallet)
  },
  unopenedWallet: async ({}, use) => {
    const wallet = new TestFedimintWallet()
    await wallet.initialize()
    await use(wallet)
  },
})

/**
 * Adds Fixtures for setting up and tearing down a test Worker instance
 */
export const workerTest = test.extend<{
  worker: Worker
  clientName: string
  transportClient: TransportClient
}>({
  worker: async ({}, use) => {
    const worker = new Worker(
      new URL('../transport/wasmTransport/worker.js', import.meta.url),
      {
        type: 'module',
      },
    )
    await use(worker)
    worker.terminate()
  },
  clientName: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    await use(randomTestingId)
  },
  transportClient: async ({}, use) => {
    const transportClient = new TransportClient()
    await use(transportClient)
  },
})
