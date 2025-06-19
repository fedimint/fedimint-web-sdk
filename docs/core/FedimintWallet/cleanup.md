# Cleanup

### `cleanup()`

Clean up the wallet instance and free associated resources.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()

await wallet.joinFederation('fed11qgq...')
await wallet.open()
// Use the wallet

// When we're no longer using the wallet,
// call cleanup to free up resources
await wallet.cleanup()

// If you want to use the wallet again, you can call open() again
await wallet.open()
```

#### Returns

`Promise<void>`

Resolves when cleanup is complete.
