# sendOnchain

### `wallet.sendOnchain(amountSats: number, address: string)`

Attempts to send bitcoin to an onchain address.

// TODO: Implement `subscribeOnchainSend` function for tracking deposit status.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const amount = 20 // amount in Sats // [!code focus]
const address = 'bc1q...' // [!code focus]

const { operation_id } = await wallet.wallet.sendOnchain(
  amount, // [!code focus]
  address, // [!code focus]
) // [!code focus]

// TODO: Implement subscribeOnchainSend function to track status with operation_id
```
