# Spend Ecash

### `mint.spendNotes(amountMsats: number)`

Generates ecash notes for spending.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()
const wallet = await director.createWallet()

await wallet.open()

const amountMsats = 10_000 // [!code focus]
const result = await wallet.mint.spendNotes(amountMsats) // [!code focus]

console.log(result.notes) // ecash notes
```
