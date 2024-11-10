# Get Balance

### `lightning.createInvoice()`

Create a Lightning Invoice for a given amount.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const invoice = await wallet.lightning.createInvoice(
  // [!code focus]
  10_000, // msats // [!code focus]
  'This is an invoice description', // [!code focus]
) // [!code focus]
```
