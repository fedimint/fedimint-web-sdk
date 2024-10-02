import { expect, test } from 'vitest'
import { TestFedimintWallet } from './TestFedimintWallet'
import { WorkerClient } from '../worker/WorkerClient'

/**
 * Adds Fixtures for setting up and tearing down a test FedimintWallet instance
 */
export const walletTest = test.extend<{
  wallet: TestFedimintWallet
  fundedWallet: TestFedimintWallet
}>({
  wallet: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    const wallet = new TestFedimintWallet()
    expect(wallet).toBeDefined()
    const inviteCode = await wallet.testing.getInviteCode()
    await expect(
      wallet.joinFederation(inviteCode, randomTestingId),
    ).resolves.toBeUndefined()
    await use(wallet)

    // clear up browser resources
    await wallet.cleanup()
    // remove the wallet db
    indexedDB.deleteDatabase(randomTestingId)
  },

  fundedWallet: async ({}, use) => {
    const wallet = new TestFedimintWallet()
    const inviteCode = await wallet.testing.getInviteCode()
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    await expect(
      wallet.joinFederation(inviteCode, randomTestingId),
    ).resolves.toBeUndefined()
    await wallet.fundWallet(10_000_000)

    await use(wallet)

    // clear up browser resources
    await wallet.cleanup()
    // remove the wallet db
    indexedDB.deleteDatabase(randomTestingId)
  },
})

/**
 * Adds Fixtures for setting up and tearing down a test Worker instance
 */
export const workerTest = test.extend<{
  worker: Worker
  clientName: string
  workerClient: WorkerClient
}>({
  worker: async ({}, use) => {
    const worker = new Worker(new URL('../worker/worker.js', import.meta.url), {
      type: 'module',
    })
    await use(worker)
    worker.terminate()
  },
  clientName: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    await use(randomTestingId)
  },
  workerClient: async ({}, use) => {
    const workerClient = new WorkerClient()
    await use(workerClient)
  },
})
