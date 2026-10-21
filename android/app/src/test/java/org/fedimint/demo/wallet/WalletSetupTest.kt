package org.fedimint.demo.wallet

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The seed's origin is written only for a directory with no seed, and a
 * restore left mid-way still finishes, so Create can't relabel its seed.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class WalletSetupTest {
    /** The SDK's side: a directory that holds a seed once an open has persisted one. */
    private class Fake(var hasSeed: Boolean = false) {
        var open = false
        val origins = mutableListOf<SeedOrigin>()
        val opens = mutableListOf<String?>()

        /** When set, an open persists the seed and then waits here before publishing. */
        var pauseAfterPersist: CompletableDeferred<Unit>? = null

        fun setup(scope: TestScope) = WalletSetup<String>(
            // Like the session's: a supervisor, so a refused step fails only its caller.
            scope = CoroutineScope(SupervisorJob() + StandardTestDispatcher(scope.testScheduler)),
            hasSeed = { hasSeed },
            isOpen = { open },
            recordOrigin = { origins += it },
            open = { mnemonic ->
                opens += mnemonic
                if (!open) {
                    hasSeed = true
                    pauseAfterPersist?.await()
                    open = true
                }
            },
        )
    }

    @Test fun `leaving Restore after the seed is stored, then Create, keeps it restored`() = runTest {
        val fake = Fake().apply { pauseAfterPersist = CompletableDeferred() }
        val setup = fake.setup(this)

        // Restore starts, the SDK stores the imported seed, and the user backs out.
        val restoring = launch { setup.restore("imported words") }
        advanceUntilIdle()
        assertTrue("the seed is stored", fake.hasSeed)
        restoring.cancel()

        // Welcome's Create, while that restore is still finishing.
        val creating = launch { setup.create() }
        advanceUntilIdle()
        fake.pauseAfterPersist!!.complete(Unit)
        advanceUntilIdle()

        assertTrue(creating.isCompleted)
        assertEquals("only the restore recorded an origin", listOf(SeedOrigin.RESTORED), fake.origins)
        assertEquals("the restore finished, then Create opened that seed", listOf("imported words", null), fake.opens)
        assertTrue(fake.open)
    }

    @Test fun `Create over a seed that is already stored records nothing`() = runTest {
        val fake = Fake(hasSeed = true)
        fake.setup(this).create()
        assertEquals(emptyList<SeedOrigin>(), fake.origins)
        assertEquals(listOf<String?>(null), fake.opens)
    }

    @Test fun `a fresh create and a fresh restore record their origin before the seed exists`() = runTest {
        val created = Fake()
        created.setup(this).create()
        assertEquals(listOf(SeedOrigin.CREATED), created.origins)

        val restored = Fake()
        restored.setup(this).restore("words")
        assertEquals(listOf(SeedOrigin.RESTORED), restored.origins)
    }

    @Test fun `restoring once a wallet is open is refused`() = runTest {
        val fake = Fake(hasSeed = true).apply { open = true }
        val result = runCatching { fake.setup(this).restore("other words") }
        assertTrue(result.isFailure)
        assertEquals(emptyList<String?>(), fake.opens)
    }
}
