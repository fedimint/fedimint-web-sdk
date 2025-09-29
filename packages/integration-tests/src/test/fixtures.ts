import { expect, test } from 'vitest'
import { WasmWorkerTransport, createWasmWorker } from '@fedimint/transport-web'
import { TransportClient } from '@fedimint/core'
import { TestFedimintWallet } from './TestFedimintWallet'
import { TestWalletDirector } from './TestWalletDirector'

/**
 * Adds Fixtures for setting up and tearing down test FedimintWallet/WalletDirector instances
 */
export const walletTest = test.extend<{
  walletDirector: TestWalletDirector
  wallet: TestFedimintWallet
  fundedWallet: TestFedimintWallet
  fundedWalletBeefy: TestFedimintWallet
  unopenedWallet: TestFedimintWallet
}>({
  walletDirector: async ({}, use) => {
    const walletDirector = new TestWalletDirector()
    await use(walletDirector)
  },
  wallet: async ({ walletDirector }, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    const wallet = await walletDirector.createTestWallet()
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
  unopenedWallet: async ({ walletDirector }, use) => {
    const wallet = await walletDirector.createTestWallet()
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
    const worker = createWasmWorker()
    await use(worker)
    worker.terminate()
  },
  clientName: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    await use(randomTestingId)
  },
  transportClient: async ({}, use) => {
    // TODO: figure out how to use a different transport in runtime depending on the test
    // Ideally, we don't want to create separate fixtures for each transport
    const transportClient = new TransportClient(new WasmWorkerTransport())
    await use(transportClient)
  },
})
