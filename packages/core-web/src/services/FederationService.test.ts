import { test, expect } from 'vitest'
import { TestFedimintWallet } from '../test/TestFedimintWallet'
import { beforeAll } from 'vitest'

let randomTestingId: string
let wallet: TestFedimintWallet

beforeAll(async () => {
  randomTestingId = Math.random().toString(36).substring(2, 15)
  wallet = new TestFedimintWallet()
  expect(wallet).toBeDefined()
  await expect(
    wallet.joinFederation(wallet.testing.TESTING_INVITE, randomTestingId),
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
  const counterBefore = wallet.testing.getRequestCounter()
  await expect(wallet.federation.getConfig()).resolves.toMatchObject({
    api_endpoints: expect.any(Object),
    broadcast_public_keys: expect.any(Object),
    consensus_version: expect.any(Object),
    meta: expect.any(Object),
    modules: expect.any(Object),
  })
  expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
})

test('getFederationId should return the federation id', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet.testing.getRequestCounter()
  const federationId = await wallet.federation.getFederationId()
  expect(federationId).toBeTypeOf('string')
  expect(federationId).toHaveLength(64)
  expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
})

test('getInviteCode should return the invite code', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet.testing.getRequestCounter()
  const inviteCode = await wallet.federation.getInviteCode(0)
  expect(inviteCode).toBeTypeOf('string')
  expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
})

test('listOperations should return the list of operations', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet.testing.getRequestCounter()
  await expect(wallet.federation.listOperations()).resolves.toMatchObject([])
  expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
})
