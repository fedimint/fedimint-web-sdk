# parseBolt11Invoice

### `parseBolt11Invoice(invoiceStr: string)`

Parses a BOLT11 invoice and extracts its components (`amount`, `expiry`, and `memo`).

```ts
// @esModuleInterop
import { FedimintWallet } from '@Fedimint/core-web'

const wallet = new FedimintWallet()

const result = await wallet.parseBolt11Invoice('lnbc1....') // [!code focus]

console.log(result)
// Output: { amount: 1000, expiry: 3600, memo: 'Payment for services' }
```
