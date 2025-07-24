# Parse Ecash Notes

### `mint.parseNotes(oobNotes: string)`

Parses an ecash note string without redeeming it. Use [`redeemEcash()`](./redeemEcash) to redeem the notes.

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const longEcashNoteString = '01A...'

const valueMsats = await wallet.mint.parseNotes(longEcashNoteString)

// later...

await wallet.mint.redeemEcash(longEcashNoteString)
```
