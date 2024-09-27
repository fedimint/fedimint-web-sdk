import { test, expect } from 'vitest'
import { TestFedimintWallet } from './test/TestFedimintWallet'
import { beforeAll } from 'vitest'

let randomTestingId: string
let wallet: TestFedimintWallet
// Testnet
const TESTING_FEDERATION =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

beforeAll(() => {
  randomTestingId = Math.random().toString(36).substring(2, 15)
  wallet = new TestFedimintWallet()
  expect(wallet.testing).toBeDefined()
  expect(wallet.testing.getRequestCounter()).toBe(1)
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
  const beforeJoin = wallet.testing.getRequestCounter()
  await expect(
    wallet.joinFederation(TESTING_FEDERATION, randomTestingId),
  ).resolves.toBeUndefined()
  expect(wallet.testing.getRequestCounter()).toBe(beforeJoin + 1)
  expect(wallet.isOpen()).toBe(true)
  await expect(wallet.waitForOpen()).resolves.toBeUndefined()
})

test('Error on open & join if wallet is already open', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  // Test opening an already open wallet
  try {
    await wallet.open(randomTestingId)
    expect.unreachable('Opening a wallet should fail on an already open wallet')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('The FedimintWallet is already open.')
  }

  // Test joining federation on an already open wallet
  try {
    await wallet.joinFederation(TESTING_FEDERATION, randomTestingId)
    expect.unreachable('Joining a federation should fail on an open wallet')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(
      'The FedimintWallet is already open. You can only call `joinFederation` on closed clients.',
    )
  }
})
test('getConfig', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)
  const config = await wallet.federation.getConfig()
  expect(config).toBeDefined()
})

test('empty getBalance', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)
  await expect(wallet.waitForOpen()).resolves.toBeUndefined()
  await expect(wallet.balance.getBalance()).resolves.toEqual(0)
})
