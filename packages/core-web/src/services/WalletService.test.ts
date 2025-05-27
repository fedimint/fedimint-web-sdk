import { expect } from 'vitest'
import { walletTest } from '../test/fixtures'
import { TxOutputSummary, WalletSummary } from '../types'

walletTest(
  'getWalletSummary should return empty object if wallet is empty',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const balance = await wallet.balance.getBalance()
    expect(balance).toEqual(0)

    const summary = await wallet.wallet.getWalletSummary()
    const expectedSummary = {
      spendable_utxos: expect.any(Array<TxOutputSummary>),
      unsigned_peg_out_txos: expect.any(Array<TxOutputSummary>),
      unsigned_change_utxos: expect.any(Array<TxOutputSummary>),
      unconfirmed_peg_out_txos: expect.any(Array<TxOutputSummary>),
      unconfirmed_change_utxos: expect.any(Array<TxOutputSummary>),
    } satisfies WalletSummary
    expect(summary).toEqual(expect.objectContaining(expectedSummary))
  },
)

walletTest('pegin should always return an address', async ({ wallet }) => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)
  const response = await wallet.wallet.pegin()

  expect(response).toEqual({
    deposit_address: expect.any(String),
    operation_id: expect.any(String),
  })
})

walletTest(
  'pegout should return an operation ID after sending funds',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const amount = 1000
    const destination =
      'bc1q2nvw96926efy0wtcm60qj26d0mspgsqjdkt9q8hwmmge2srkelgswz76zz'

    const response = await wallet.wallet.pegout(amount, destination)

    expect(response).toEqual({
      operation_id: expect.any(String),
    })
  },
)
