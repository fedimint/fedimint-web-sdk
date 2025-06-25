# Spend Ecash

### `mint.spendNotes(amountMsats: number)`

Generates ecash notes for spending.

```ts twoslash
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const amountMsats = 10_000 // [!code focus]
const result = await wallet.mint.spendNotes(amountMsats) // [!code focus]

console.log(result.notes) // ecash notes
```
