import { describe, expect } from 'vitest'
import { ErrorCode } from '@fedimint/web-sdk'
import { sdkTest } from './fixtures'

// Deposits and withdrawals settle only with mined blocks, which devimint's faucet cannot mine;
// the crate's own tests cover that with bitcoin-cli. What is tested here is what the browser
// reaches without a block: the address, the quote and the deposit subscription.
describe('onchain', () => {
  sdkTest(
    'hands out a fresh regtest deposit address each time',
    async ({ federation }) => {
      const onchain = (await federation.onchain())!
      const address = await onchain.receive()
      expect(address).toMatch(/^bcrt1/)
      expect(await onchain.receive()).not.toBe(address)
    },
  )

  sdkTest('refuses a quote it cannot fill', async ({ federation }) => {
    const onchain = (await federation.onchain())!
    // A well-formed address for the wrong chain, from `bitcoin`'s own test suite.
    const mainnet = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
    await expect(onchain.quote(mainnet, 50_000n)).rejects.toMatchObject({
      name: 'SdkError',
      code: ErrorCode.NetworkMismatch,
    })
    const address = await onchain.receive()
    await expect(onchain.quote(address, 0n)).rejects.toMatchObject({
      code: ErrorCode.InvalidInput,
    })
    // Below the dust threshold.
    await expect(onchain.quote(address, 100n)).rejects.toMatchObject({
      code: ErrorCode.InvalidInput,
    })
    // Above what an empty wallet holds.
    await expect(onchain.quote(address, 50_000n)).rejects.toMatchObject({
      code: ErrorCode.InsufficientBalance,
    })
  })

  sdkTest(
    'a deposit subscription waits until it is aborted',
    async ({ federation }) => {
      const onchain = (await federation.onchain())!
      await onchain.receive()
      const deposits = await onchain.deposits()
      const controller = new AbortController()
      const waiting = deposits.next({ signal: controller.signal })
      setTimeout(() => controller.abort(), 200)
      await expect(waiting).rejects.toMatchObject({ name: 'AbortError' })
      await expect(
        deposits.next({ signal: AbortSignal.abort() }),
      ).rejects.toMatchObject({ name: 'AbortError' })
    },
  )
})
