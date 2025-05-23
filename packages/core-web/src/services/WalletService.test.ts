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
