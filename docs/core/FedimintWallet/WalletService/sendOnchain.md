# sendOnchain

### `wallet.sendOnchain(amountSats: number, address: string)`

Attempts to send bitcoin to an onchain address.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()
const wallet = await director.createWallet()

await wallet.open()

const amount = 20 // amount in Sats // [!code focus]
const address = 'bc1q...' // [!code focus]

const { operation_id } = await wallet.wallet.sendOnchain(
  amount, // [!code focus]
  address, // [!code focus]
) // [!code focus]
```
