# Cleanup

### `cleanup()`

Clean up the wallet instance and free associated resources.

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation, cleanup } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

// Use the wallet
const balance = await wallet.balance.getBalance()

// When you're done with all wallets, clean up resources
await cleanup()
```

#### Returns

`Promise<void>`

Resolves when cleanup is complete.
