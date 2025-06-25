# Get Balance

### `balance.getBalance()`

Get the current balance of the wallet in milli-satoshis (MSats).

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const mSats = await wallet.balance.getBalance() // [!code focus]

// 1000 mSats = 1 satoshi
```
