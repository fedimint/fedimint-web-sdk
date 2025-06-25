# Get Wallet Summary

### `wallet.getWalletSummary()`

Gives wallet UTXO set

```ts twoslash
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const utxos = await wallet.wallet.getWalletSummary()
console.log('spendable utxos are: ', utxos.spendable_utxos)
console.log('unsigned pegout utxos are: ', utxos.unsigned_peg_out_txos)
console.log('unsigned change utxos are: ', utxos.unsigned_change_utxos)
console.log('unconfirmed pegout utxos are: ', utxos.unconfirmed_peg_out_txos)
console.log('unconfirmed change utxos are: ', utxos.unconfirmed_change_utxos)
```
