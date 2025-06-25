# Is Open

### `isOpen()`

Check if the wallet is currently open and connected to a federation.

```ts twoslash
// @esModuleInterop
import { initialize, getWallet, joinFederation } from '@fedimint/core-web'

await initialize()

// Get an existing wallet
const wallet = getWallet('my-wallet-id')

if (wallet) {
  const isOpen = wallet.isOpen() // [!code focus]

  if (isOpen) {
    const balance = await wallet.balance.getBalance()
  }
} else {
  // Create a new wallet
  const newWallet = await joinFederation('fed123...', 'my-wallet-id')
}
```
