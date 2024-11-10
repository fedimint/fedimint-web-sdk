# Subscribe Balance

### `balance.subscribeBalance()` <Badge type="info" text="Streaming" />

Subscribe to balance updates as they occur.

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const unsubscribe = wallet.balance.subscribeBalance((mSats) => { // [!code focus]
  console.log('Balance updated:', mSats) // [!code focus]
  // 1000 mSats = 1 satoshi // [!code focus]
}) // [!code focus]

// ...Cleanup Later
unsubscribe()
```
