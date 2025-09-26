# GetNotesByDenomination

### `mint.getNotesByDenomination()`

Gives count of ecash notes by denomination present in the wallet.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()
const wallet = await director.createWallet()

await wallet.open()

const notes = await wallet.mint.getNotesByDenomination()
console.log('Notes are: ', notes) // {1: 2, 2: 1, 8: 2}
```
