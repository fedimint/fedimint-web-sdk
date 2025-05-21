# getWalletSummary

### `wallet.getWalletSummary()`

Gives wallet UTXO set

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const utxos = await wallet.wallet.getWalletSummary()
console.log('spendable utxos are: ', utxos.spendable_utxos)
console.log('unsigned pegout utxos are: ', utxos.unsigned_peg_out_txos)
console.log('unsigned chande utxos are: ', utxos.unsigned_change_utxos)
console.log('unconfirmed pegout utxos are: ', utxos.unconfirmed_peg_out_utxos)
console.log('unconfirmed change utxos are: ', utxos.unconfirmed_change_utxos)
```
