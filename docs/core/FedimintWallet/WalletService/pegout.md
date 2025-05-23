# pegout

### `wallet.pegout(amount,address,extraMeta)`

Withdraw bitcoin from federation to certain address.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const amount = 20 // amount in sat
const address = '0x3432....'
const extraMeta = {}

const { operation_id } = await wallet.wallet.pegout(amount, address, extraMeta)
```
