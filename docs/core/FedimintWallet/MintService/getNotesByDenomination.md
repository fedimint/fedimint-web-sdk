# Get Notes By Denomination

### `mint.getNotesByDenomination()`

Gives count of ecash notes by denomination present in the wallet.

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const notes = await wallet.mint.getNotesByDenomination()
console.log('Notes are: ', notes) // {1: 2, 2: 1, 8: 2}
```
