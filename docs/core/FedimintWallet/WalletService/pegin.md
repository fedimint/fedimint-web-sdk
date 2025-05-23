# pegin

### `wallet.pegin(extraMeta)`

Gives operation_id and deposit_address to deposit bitcoin to federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const extraMeta = {}

const { deposit_address, operation_id } = await wallet.wallet.pegin(extraMeta)
```
