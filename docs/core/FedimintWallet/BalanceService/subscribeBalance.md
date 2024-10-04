# Subscribe Balance

### `balance.subscribeBalance()` <Badge type="info" text="Streaming" />

Subscribe to balance updates as they occur.

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

// ---cut---
const unsubscribe = wallet.balance.subscribeBalance((mSats) => {
  console.log('Balance updated:', mSats)
  // 1000 mSats = 1 satoshi
})

// ...Cleanup Later
unsubscribe()
```
