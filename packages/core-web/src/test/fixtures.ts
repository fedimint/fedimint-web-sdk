import { afterAll, beforeAll, expect, onTestFinished, test } from 'vitest'
import { RpcClient } from '../rpc'
import { createWebWorkerTransport } from '../worker/WorkerTransport'
import {
  cleanup,
  generateMnemonic,
  getMnemonic,
  initialize,
  joinFederation,
  listClients,
  nukeData,
  removeWallet,
  setLogLevel,
  Wallet,
} from '..'
import { fundWallet, TESTING_INVITE, getRandomTestingId } from './testUtils'

setLogLevel('debug')

// Initialize the global instance
beforeAll(async () => {
  const existingMnemonic = await getMnemonic()
  if (!existingMnemonic || !existingMnemonic.length) {
    // initialize()
    const mnemonic = await generateMnemonic()
    expect(mnemonic).toBeDefined()
  }

  expect(TESTING_INVITE).toBeDefined()

  return async () => {
    // const wallets = listClients()
    // console.warn('----------wallets', wallets)
    // await nukeData()
    // const mnemonic = await getMnemonic()
    // console.warn('----------mnemonic', mnemonic)
    // expect(mnemonic).toBeNull()
  }
})

/**
 * Adds Fixtures for setting up and tearing down a test FedimintWallet instance
 */
export const walletTest = test.extend<{
  wallet: Wallet
  fundedWallet: Wallet
  unopenedWallet: Wallet
}>({
  wallet: async ({}, use) => {
    const randomTestingId = getRandomTestingId()
    const wallet = await joinFederation(TESTING_INVITE, randomTestingId)
    await expect(wallet).toBeDefined()

    onTestFinished(async () => {
      // clear up browser resources
      await removeWallet(wallet.id)
    })

    await use(wallet)

    // // remove the wallet db
    // await new Promise((resolve) => {
    //   const request = indexedDB.deleteDatabase(randomTestingId)
    //   request.onsuccess = resolve
    //   request.onerror = resolve
    //   request.onblocked = resolve
    // })
  },

  fundedWallet: async ({ wallet }, use) => {
    await fundWallet(wallet)
    await use(wallet)
  },
  unopenedWallet: async ({}, use) => {
    const wallet = await joinFederation(TESTING_INVITE)
    await use(wallet)
  },
})

/**
 * Adds Fixtures for setting up and tearing down a test Worker instance
 */
export const workerTest = test.extend<{
  worker: Worker
  clientName: string
  workerClient: RpcClient
}>({
  worker: async ({}, use) => {
    const worker = new Worker(new URL('../worker/worker.js', import.meta.url), {
      type: 'module',
    })
    await use(worker)
    worker.terminate()
  },
  clientName: async ({}, use) => {
    const randomTestingId = getRandomTestingId()
    await use(randomTestingId)
  },
  workerClient: async ({}, use) => {
    const workerClient = new RpcClient(createWebWorkerTransport)
    await use(workerClient)
  },
})
