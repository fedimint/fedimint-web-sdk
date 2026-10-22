import { describe, expect } from 'vitest'
import {
  ErrorCode,
  FederationStatus_Tags,
  RecoveryState_Tags,
} from '@fedimint/web-sdk'
import { sdkTest, withSession } from './fixtures'

describe('recovery', () => {
  sdkTest(
    'a joined federation has no recovery to report or resume',
    async ({ session, federation }) => {
      const id = await federation.id()
      expect(await session.sdk.recoveryStatus(id)).toBeUndefined()
      await expect(session.sdk.resumeRecovery(id)).rejects.toMatchObject({
        name: 'SdkError',
        code: ErrorCode.InvalidInput,
      })
    },
  )

  sdkTest(
    'restores a funded wallet from its seed on a fresh storage',
    async ({ session, invite, funded }) => {
      const { federation, balance } = funded
      const id = await federation.id()
      const words = await (await session.sdk.exportMnemonic()).words()
      const inviteText = await invite.display()
      await session.close()

      await withSession(
        'recovered',
        async (second) => {
          const recovery = await second.sdk.recover(
            await second.InviteCode.parse(inviteText),
          )
          expect(await recovery.federation.id()).toBe(id)

          // The rescan on devimint takes seconds and may be done before `recover` returns, so the
          // lock is asserted only while it can still be observed.
          const status = await second.sdk.federationStatus(id)
          if (status?.tag === FederationStatus_Tags.Recovering) {
            const lightning = (await recovery.federation.lightning())!
            await expect(
              lightning.receive(1_000n, 'locked'),
            ).rejects.toMatchObject({
              code: ErrorCode.Recovering,
            })
            // Reading a balance is not fund-touching.
            await recovery.federation.balance()
          }

          const last = await recovery.progress.awaitFinal()
          expect(last.tag).toBe(RecoveryState_Tags.Done)
          // `Done` waits for the notes the rescan found to be issued, so the balance is restored.
          expect(await recovery.federation.balance()).toBe(balance)
          expect((await second.sdk.recoveryStatus(id))?.tag).toBe(
            RecoveryState_Tags.Done,
          )
          expect((await second.sdk.federationStatus(id))?.tag).toBe(
            FederationStatus_Tags.Running,
          )

          // Resuming a completed recovery hands back the same attempt rather than a new one.
          const resumed = await second.sdk.resumeRecovery(id)
          expect(await resumed.progress.id()).toBe(await recovery.progress.id())
          expect((await resumed.progress.state()).tag).toBe(
            RecoveryState_Tags.Done,
          )
          await expect(
            second.sdk.recover(await second.InviteCode.parse(inviteText)),
          ).rejects.toMatchObject({ code: ErrorCode.AlreadyJoined })

          // The restored wallet works like any other.
          const page = await recovery.federation.activity(undefined, 10)
          expect(Array.isArray(page.items)).toBe(true)
          const ecash = (await recovery.federation.ecash())!
          expect(await (await ecash.quote(1_000n)).requestedAmount()).toBe(
            1_000n,
          )
        },
        { mnemonic: words },
      )
    },
  )
})
