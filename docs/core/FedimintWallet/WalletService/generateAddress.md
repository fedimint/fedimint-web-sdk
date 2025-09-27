# generateAddress

### `wallet.generateAddress()`

Create an onchain address. Returns a `deposit_address` (string) and an `operation_id` (string).

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()
const wallet = await director.createWallet()

await wallet.open()

const { deposit_address, operation_id } = await wallet.wallet.generateAddress() // [!code focus]
```
