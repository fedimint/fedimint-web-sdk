import { test, expect } from 'vitest'
import { FedimintWallet } from '../FedimintWallet'
import { beforeAll } from 'vitest'

let randomTestingId: string
let wallet: FedimintWallet
// Testnet
const TESTING_FEDERATION =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

beforeAll(async () => {
  randomTestingId = Math.random().toString(36).substring(2, 15)
  wallet = new FedimintWallet()
  expect(wallet).toBeDefined()
  await expect(
    wallet.joinFederation(TESTING_FEDERATION, randomTestingId),
  ).resolves.toBeUndefined()
  expect(wallet.isOpen()).toBe(true)

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

test('getConfig should return the federation config', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)
  const counterBefore = wallet._testing!.getRequestCounter()
  await expect(wallet.federation.getConfig()).resolves.toMatchObject({
    api_endpoints: expect.any(Object),
    broadcast_public_keys: expect.any(Object),
    consensus_version: expect.any(Object),
    meta: expect.any(Object),
    modules: expect.any(Object),
  })
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
})

test('getFederationId should return the federation id', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet._testing!.getRequestCounter()
  const federationId = await wallet.federation.getFederationId()
  expect(federationId).toBeTypeOf('string')
  expect(federationId).toHaveLength(64)
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
})

test('getInviteCode should return the invite code', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet._testing!.getRequestCounter()
  const inviteCode = await wallet.federation.getInviteCode(0)
  expect(inviteCode).toBeTypeOf('string')
  expect(inviteCode).toHaveLength(154)
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
})

test('listOperations should return the list of operations', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet._testing!.getRequestCounter()
  await expect(wallet.federation.listOperations()).resolves.toMatchObject([])
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
})
