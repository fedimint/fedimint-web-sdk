# Parse Ecash Notes

### `mint.parseNotes(oobNotes: string)`

Parses an ecash note string without redeeming it. Use [`redeemEcash()`](./redeemEcash) to redeem the notes.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()
await wallet.joinFederation('fed11qgq...')

const longEcashNoteString = '01A...'

const valueMsats = await wallet.mint.parseNotes(longEcashNoteString)

// later...

await wallet.mint.redeemEcash(longEcashNoteString)
```
