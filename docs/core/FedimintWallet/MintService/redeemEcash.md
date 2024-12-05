# Redeem Ecash

### `mint.redeemEcash(notes: string)`

Redeem a set of ecash notes.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

try {
  await wallet.mint.redeemEcash('01...') // [!code focus]
} catch (error) {
  console.error('Failed to redeem ecash', error)
}
```
