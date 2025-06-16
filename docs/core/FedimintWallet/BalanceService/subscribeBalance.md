# Subscribe to Balance Updates

### `balance.subscribeBalance()`

Subscribe to balance updates. Returns an unsubscribe function.

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()
await wallet.joinFederation('fed11qgq...')

const unsubscribe = wallet.balance.subscribeBalance((mSats) => { // [!code focus]
  console.log('Balance updated:', mSats) // [!code focus]
  // 1000 mSats = 1 satoshi // [!code focus]
}) // [!code focus]

// ...Cleanup Later
unsubscribe()
```

#### Parameters

• **callback**: `(balance: number) => void`

Callback function that receives balance updates in millisatoshis.

#### Returns

`() => void`

Function to unsubscribe from balance updates.
