# Get Balance

### `balance.getBalance()`

Get the current balance of the wallet in milli-satoshis (MSats).

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
await wallet.open()

const mSats = await wallet.balance.getBalance() // [!code focus]

// 1000 mSats = 1 satoshi
```
