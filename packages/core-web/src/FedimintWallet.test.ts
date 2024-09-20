import { test, expect, vi } from 'vitest'
import { FedimintWallet } from './FedimintWallet'
import { beforeAll } from 'vitest'

let randomTestingId: string
let wallet: FedimintWallet
// Testnet
const TESTING_FEDERATION =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

beforeAll(() => {
  randomTestingId = Math.random().toString(36).substring(2, 15)
  wallet = new FedimintWallet()
  expect(wallet).toBeDefined()

  // Cleanup after all tests
  return async () => {
    // clear up browser resources
    await wallet.cleanup()
    // remove the wallet db
    indexedDB.deleteDatabase(randomTestingId)
    // swap out the randomTestingId for a new one, to avoid raciness
    randomTestingId = Math.random().toString(36).substring(2, 15)
  }
})

test('initial open & join', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(false)
  // On initial open, it should return false
  // because no federations have been joined
  await expect(wallet.open(randomTestingId)).resolves.toBe(false)
  await expect(
    wallet.joinFederation(TESTING_FEDERATION, randomTestingId),
  ).resolves.toBeUndefined()
  expect(wallet.isOpen()).toBe(true)
  await expect(wallet.waitForOpen()).resolves.toBeUndefined()
})

test('Error on open & join if wallet is already open', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  // Test opening an already open wallet
  try {
    await wallet.open(randomTestingId)
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(
      'The FedimintWallet is already open. You can only call `FedimintWallet.open on closed clients.`',
    )
  }

  // Test joining federation on an already open wallet
  try {
    await wallet.joinFederation(TESTING_FEDERATION, randomTestingId)
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(
      'The FedimintWallet is already open. You can only call `FedimintWallet.joinFederation` on closed clients.',
    )
  }
})
test('getConfig', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)
  const config = await wallet.getConfig()
  expect(config).toBeDefined()
})

test('empty getBalance', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)
  await expect(wallet.waitForOpen()).resolves.toBeUndefined()
  await expect(wallet.getBalance()).resolves.toEqual(0)
})
