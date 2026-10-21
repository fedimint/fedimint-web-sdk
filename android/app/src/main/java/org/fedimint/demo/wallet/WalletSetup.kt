package org.fedimint.demo.wallet

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Creating or restoring the wallet's seed, as one step at a time that no
 * screen can cut short.
 *
 * The seed's origin decides whether joining recovers funds (see [SeedOrigin]),
 * so it is written only for a directory that holds no seed yet, just before
 * the SDK persists one. A step that finds a seed already there (a restore that
 * was left mid-way, say) opens it and leaves its origin alone: Create can never
 * relabel an imported seed as fresh.
 *
 * Steps run one after another on [scope], the session's, not the caller's:
 * leaving the Restore screen mid-restore doesn't cancel it, and a Create
 * tapped meanwhile waits for it and then finds its seed.
 *
 * Generic over the mnemonic type, with the SDK calls passed in, so the rules
 * are testable without the native library.
 */
class WalletSetup<M : Any>(
    private val scope: CoroutineScope,
    private val hasSeed: () -> Boolean,
    private val isOpen: () -> Boolean,
    private val recordOrigin: suspend (SeedOrigin) -> Unit,
    private val open: suspend (M?) -> Unit,
) {
    private val steps = Mutex()

    /** Opens the wallet, creating a seed if there is none. */
    suspend fun create() = run(null)

    /** Opens the wallet over [mnemonic]. Refused once a wallet is open on this device. */
    suspend fun restore(mnemonic: M) = run(mnemonic)

    private suspend fun run(mnemonic: M?) = scope.async {
        steps.withLock {
            if (mnemonic != null && isOpen()) throw IllegalStateException("This device already holds a wallet.")
            if (!isOpen() && !hasSeed()) recordOrigin(if (mnemonic == null) SeedOrigin.CREATED else SeedOrigin.RESTORED)
            open(mnemonic)
        }
    }.await()
}
