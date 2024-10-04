# Get Balance

### `balance.getBalance()`

Get the current balance of the wallet.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

// ---cut---
const mSats = await wallet.balance.getBalance()

// 1000 mSats = 1 satoshi
```
