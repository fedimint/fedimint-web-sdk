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

test('createInvoice should create a bolt11 invoice', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet._testing!.getRequestCounter()
  const invoice = await wallet.lightning.createInvoice(100, 'test')
  expect(invoice).toBeDefined()
  expect(invoice).toMatchObject({
    invoice: expect.any(String),
    operation_id: expect.any(String),
  })
  // 3 requests were made, one for the invoice, one for refreshing the
  // gateway cache, one for getting the gateway info
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 3)

  // Test with expiry time
  await expect(
    wallet.lightning.createInvoice(100, 'test', 1000, {}),
  ).resolves.toBeDefined()
})

test('listGateways should return a list of gateways', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet._testing!.getRequestCounter()
  const gateways = await wallet.lightning.listGateways()
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
  expect(gateways).toBeDefined()
  expect(gateways).toMatchObject([
    {
      info: expect.any(Object),
    },
  ])
})

test('updateGatewayCache should update the gateway cache', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet._testing!.getRequestCounter()
  await expect(wallet.lightning.updateGatewayCache()).resolves.toBeDefined()
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
})

test('getGateway should return a gateway', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet._testing!.getRequestCounter()
  const gateway = await wallet.lightning.getGateway()
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
  expect(gateway).toMatchObject({
    api: expect.any(String),
    fees: expect.any(Object),
    gateway_id: expect.any(String),
    gateway_redeem_key: expect.any(String),
    lightning_alias: expect.any(String),
    mint_channel_id: expect.any(Number),
    node_pub_key: expect.any(String),
    route_hints: expect.any(Array),
  })
})

test('createInvoiceWithGateway should create a bolt11 invoice with a gateway', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const gateways = await wallet.lightning.listGateways()
  const gateway = gateways[0]
  expect(gateway).toBeDefined()

  const counterBefore = wallet._testing!.getRequestCounter()
  const invoice = await wallet.lightning.createInvoiceWithGateway(
    100,
    'test',
    null,
    {},
    gateway.info,
  )
  expect(invoice).toBeDefined()
  expect(invoice).toMatchObject({
    invoice: expect.any(String),
    operation_id: expect.any(String),
  })
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 1)
  await expect(
    wallet.lightning.createInvoiceWithGateway(
      100,
      'test',
      1000,
      {},
      gateway.info,
    ),
  ).resolves.toBeDefined()
})

test('payInvoice should pay a bolt11 invoice', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const invoice = await wallet.lightning.createInvoice(100, 'test')
  expect(invoice).toBeDefined()
  expect(invoice).toMatchObject({
    invoice: expect.any(String),
    operation_id: expect.any(String),
  })

  const counterBefore = wallet._testing!.getRequestCounter()
  // Insufficient funds
  try {
    await wallet.lightning.payInvoice(invoice.invoice, {})
    expect.unreachable('Should throw error')
  } catch (error) {
    expect(error).toBeDefined()
  }
  // 3 requests were made, one for paying the invoice, one for refreshing the
  // gateway cache, one for getting the gateway info
  expect(wallet._testing!.getRequestCounter()).toBe(counterBefore + 3)
})
