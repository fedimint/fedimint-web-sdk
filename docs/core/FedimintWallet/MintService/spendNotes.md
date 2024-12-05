# Spend Ecash

### `mint.spendNotes(amountMsats: number)`

Generates ecash notes for spending.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const amountMsats = 10_000 // [!code focus]
const result = await wallet.mint.spendNotes(amountMsats) // [!code focus]

console.log(result.notes) // ecash notes
```
