import { expect, test } from 'vitest'

import { Federation } from './Federation'
import { WorkerClient } from '../worker/WorkerClient'
import { TestingService } from '../test/TestingService'

class TestFederation extends Federation {
  public testing: TestingService

  constructor() {
    super()
    this.testing = new TestingService(this.getWorkerClient())
  }

  // Method to expose the WorkerClient
  getWorkerClient(): WorkerClient {
    return this['client']
  }
}

/**
 * Adds Fixtures for setting up and tearing down a test Fedimintfederation instance
 */
const federationTest = test.extend<{ federation: TestFederation }>({
  federation: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    const federation = new TestFederation()
    expect(federation).toBeDefined()

    await expect(
      federation.joinFederation(
        federation.testing.TESTING_INVITE,
        randomTestingId,
      ),
    ).resolves.toBeUndefined()
    await use(federation)

    // clear up browser resources
    await federation.cleanup()
    // remove the federation db
    indexedDB.deleteDatabase(randomTestingId)
  },
})

federationTest(
  'getConfig should return the federation config',
  async ({ federation }) => {
    expect(federation).toBeDefined()
    expect(federation.isOpen()).toBe(true)
    const counterBefore = federation.testing.getRequestCounter()
    await expect(federation.getConfig()).resolves.toMatchObject({
      api_endpoints: expect.any(Object),
      broadcast_public_keys: expect.any(Object),
      consensus_version: expect.any(Object),
      meta: expect.any(Object),
      modules: expect.any(Object),
    })
    expect(federation.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)

federationTest(
  'getFederationId should return the federation id',
  async ({ federation }) => {
    expect(federation).toBeDefined()
    expect(federation.isOpen()).toBe(true)

    const counterBefore = federation.testing.getRequestCounter()
    const federationId = await federation.getFederationId()
    expect(federationId).toBeTypeOf('string')
    expect(federationId).toHaveLength(64)
    expect(federation.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)

federationTest(
  'getInviteCode should return the invite code',
  async ({ federation }) => {
    expect(federation).toBeDefined()
    expect(federation.isOpen()).toBe(true)

    const counterBefore = federation.testing.getRequestCounter()
    const inviteCode = await federation.getInviteCode(0)
    expect(inviteCode).toBeTypeOf('string')
    expect(federation.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)

federationTest(
  'listOperations should return the list of operations',
  async ({ federation }) => {
    expect(federation).toBeDefined()
    expect(federation.isOpen()).toBe(true)

    const counterBefore = federation.testing.getRequestCounter()
    await expect(federation.listOperations()).resolves.toMatchObject([])
    expect(federation.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)
