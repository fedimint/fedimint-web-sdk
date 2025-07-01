# generateAddress

### `wallet.generateAddress()`

Create an onchain address. Returns a `deposit_address` (string) and an `operation_id` (string).

// TODO: Implement `subscribeOnchainReceive` function for tracking deposit status.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const { deposit_address, operation_id } = await wallet.wallet.generateAddress() // [!code focus]

// TODO: Implement subscribeOnchainReceive function to track status with operation_id
```
