# parseBolt11Invoice

### `parseBolt11Invoice(invoiceStr: string)`

Parses a BOLT11 invoice and extracts its components (`amount`, `expiry`, and `memo`).

```ts
// @esModuleInterop
import { WalletDirector } from '@fedimint/core'

const director = new WalletDirector(new WasmWorkerTransport())

const result = await director.parseBolt11Invoice('lnbc1....') // [!code focus]

console.log(result)
// Output: { amount: 1000, expiry: 3600, memo: 'Payment for services' }
```
