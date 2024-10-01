import { expect } from 'vitest'
import { walletTest } from '../test/setupTests'

walletTest('redeemEcash should error on invalid ecash', async ({ wallet }) => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  await expect(wallet.mint.redeemEcash('test')).rejects.toThrow()
})

walletTest(
  'reissueExternalNotes should reissue external notes',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    await expect(wallet.mint.reissueExternalNotes('test')).rejects.toThrow()
  },
)
