# Is Open

### `isOpen()`

Check if the wallet is currently open and connected to a federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()

const isOpen = wallet.isOpen() // [!code focus]

if (!isOpen) {
  await wallet.joinFederation('fed123...')
} else {
  const balance = await wallet.balance.getBalance()
}
```
