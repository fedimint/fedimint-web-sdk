import { expect } from 'vitest'
import { walletTest } from '../test/setupTests'

walletTest(
  'createInvoice should create a bolt11 invoice',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const counterBefore = wallet.testing.getRequestCounter()
    const invoice = await wallet.lightning.createInvoice(100, 'test')
    expect(invoice).toBeDefined()
    expect(invoice).toMatchObject({
      invoice: expect.any(String),
      operation_id: expect.any(String),
    })
    // 3 requests were made, one for the invoice, one for refreshing the
    // gateway cache, one for getting the gateway info
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 3)

    // Test with expiry time
    await expect(
      wallet.lightning.createInvoice(100, 'test', 1000, {}),
    ).resolves.toBeDefined()
  },
)

walletTest('createInvoice with expiry', async ({ wallet }) => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const invoice = await wallet.lightning.createInvoice(100, 'test', 1000, {})
  expect(invoice).toBeDefined()
  expect(invoice).toMatchObject({
    invoice: expect.any(String),
    operation_id: expect.any(String),
  })
})

walletTest(
  'listGateways should return a list of gateways',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const counterBefore = wallet.testing.getRequestCounter()
    const gateways = await wallet.lightning.listGateways()
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
    expect(gateways).toBeDefined()
    expect(gateways).toMatchObject(expect.any(Array))
  },
)

walletTest(
  'updateGatewayCache should update the gateway cache',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const counterBefore = wallet.testing.getRequestCounter()
    await expect(wallet.lightning.updateGatewayCache()).resolves.toBeDefined()
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)

walletTest('getGateway should return a gateway', async ({ wallet }) => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet.testing.getRequestCounter()
  const gateway = await wallet.lightning.getGateway()
  expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
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

walletTest(
  'createInvoiceWithGateway should create a bolt11 invoice with a gateway',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    // const gateways = await wallet.lightning.listGateways()
    // const gateway = gateways[1]
    // expect(gateway).toBeDefined()
    const info = await wallet.testing.getFaucetGatewayInfo()

    const invoice = await wallet.lightning.createInvoiceWithGateway(
      100,
      'test',
      info,
    )
    expect(invoice).toMatchObject({
      invoice: expect.any(String),
      operation_id: expect.any(String),
    })
    const res = await wallet.testing.payFaucetInvoice(invoice.invoice)
    expect(res).toBeDefined()
    await wallet.lightning.waitForReceive(invoice.operation_id)
    const balance = await wallet.balance.getBalance()
    expect(balance).toBeGreaterThan(0)
  },
)

walletTest(
  'payInvoice should throw on insufficient funds',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const invoice = await wallet.lightning.createInvoice(100, 'test')
    expect(invoice).toBeDefined()
    expect(invoice).toMatchObject({
      invoice: expect.any(String),
      operation_id: expect.any(String),
    })

    const counterBefore = wallet.testing.getRequestCounter()
    // Insufficient funds
    try {
      await wallet.lightning.payInvoice(invoice.invoice, {})
      expect.unreachable('Should throw error')
    } catch (error) {
      expect(error).toBeDefined()
    }
    // 3 requests were made, one for paying the invoice, one for refreshing the
    // gateway cache, one for getting the gateway info
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 3)
  },
)

walletTest(
  'payInvoice should pay a bolt11 invoice',
  // { timeout: 45000 },
  async ({ fundedWallet }) => {
    expect(fundedWallet).toBeDefined()
    expect(fundedWallet.isOpen()).toBe(true)
    const initialBalance = await fundedWallet.balance.getBalance()
    expect(initialBalance).toBeGreaterThan(0)
    console.error('initialBalance', initialBalance)
    const externalInvoice = await fundedWallet.testing.createFaucetInvoice(100)
    console.error('EXTERNAL INVOICE', externalInvoice)
    const gatewayInfo = await fundedWallet.testing.getFaucetGatewayInfo()
    const payment = await fundedWallet.lightning.payInvoiceWithGateway(
      externalInvoice,
      gatewayInfo,
    )
    expect(payment).toMatchObject({
      contract_id: expect.any(String),
      fee: expect.any(Number),
      payment_type: expect.any(Object),
    })
    // console.error('PAYMENT', payment)
    const finalBalance = await fundedWallet.balance.getBalance()
    expect(finalBalance).toBeLessThan(initialBalance)
    // console.error(finalBalance, initialBalance)
  },
)
