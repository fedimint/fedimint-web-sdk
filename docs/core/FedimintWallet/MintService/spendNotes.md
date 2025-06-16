# Spend Ecash

### `mint.spendNotes(amountMsats: number)`

Generates ecash notes for spending.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()
await wallet.joinFederation('fed11qgq...')

const amountMsats = 10_000 // [!code focus]
const result = await wallet.mint.spendNotes(amountMsats) // [!code focus]

console.log(result.notes) // ecash notes
```
