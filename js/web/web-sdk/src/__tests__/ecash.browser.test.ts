import { describe, expect } from 'vitest'
import {
  EcashReceiveState_Tags,
  EcashSendState,
  ErrorCode,
  OperationKind,
} from '@fedimint/web-sdk'
import { faucet, sdkTest, withSession } from './fixtures'

describe('ecash', () => {
  sdkTest('refuses a quote on an empty wallet', async ({ federation }) => {
    const ecash = (await federation.ecash())!
    await expect(ecash.quote(1_000n)).rejects.toMatchObject({
      name: 'SdkError',
      code: ErrorCode.InsufficientBalance,
    })
  })

  sdkTest(
    'sends notes out of band, and another wallet redeems them',
    async ({ session, funded }) => {
      const { federation, balance } = funded
      const ecash = (await federation.ecash())!

      const quote = await ecash.quote(10_000n)
      expect(await quote.requestedAmount()).toBe(10_000n)
      const notesValue = await quote.notesValue()
      expect(notesValue).toBeGreaterThanOrEqual(10_000n)
      const fee = await quote.fee()
      const total = await quote.total()
      expect(total).toBe(notesValue + fee)
      expect(await quote.federationId()).toBe(await federation.id())
      expect(await quote.expiresAt()).toBeGreaterThan(BigInt(Date.now()))

      const sent = await ecash.send(quote)
      const text = await sent.notes.display()
      expect(text.length).toBeGreaterThan(0)
      expect(await sent.notes.value()).toBe(notesValue)
      // A plain enum crosses as a number, not as a tagged object.
      expect(await sent.operation.state()).toBe(EcashSendState.Created)
      expect(await federation.balance()).toBe(balance - total)
      // The sender can read its own notes back.
      expect(await (await session.Notes.parse(text)).value()).toBe(notesValue)

      // The receiver is a wallet of its own, joined to the same federation.
      const received = await withSession('receiver', async (receiver) => {
        const invite = await receiver.InviteCode.parse(
          await faucet.inviteCode(),
        )
        const other = await receiver.sdk.join(invite)
        const notes = await receiver.Notes.parse(text)
        const receive = await (await other.ecash())!.receive(notes)
        const final = await receive.awaitFinal()
        expect(final.tag).toBe(EcashReceiveState_Tags.Done)
        return other.balance()
      })
      expect(received).toBeGreaterThan(0n)
      expect(received).toBeLessThanOrEqual(notesValue)

      // The sender does not learn of the redemption yet: its send stays `Created` until the
      // automatic reclaim, due 24 hours after the send, fails because the notes are spent.
      expect(await sent.operation.state()).toBe(EcashSendState.Created)
      const details = await sent.operation.details()
      expect(details.reclaimAt).toBeGreaterThan(BigInt(Date.now()))
    },
  )

  sdkTest('a wallet can redeem its own notes', async ({ session, funded }) => {
    const { federation, balance } = funded
    const ecash = (await federation.ecash())!
    const sent = await ecash.send(await ecash.quote(5_000n))
    const notes = await session.Notes.parse(await sent.notes.display())
    const receive = await ecash.receive(notes)
    expect((await receive.awaitFinal()).tag).toBe(EcashReceiveState_Tags.Done)
    const after = await federation.balance()
    // Only the fees are gone.
    expect(after).toBeLessThanOrEqual(balance)
    expect(after).toBeGreaterThan(balance - 5_000n)
    const kinds = (await federation.activity(undefined, 10)).items.map(
      (item) => item.kind,
    )
    expect(kinds).toEqual(
      expect.arrayContaining([
        OperationKind.EcashSend,
        OperationKind.EcashReceive,
      ]),
    )
  })
})
