# Redeem Ecash

### `federation.getConfig()`

Access configuration details about a connected federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const config = await wallet.federation.getConfig() // [!code focus]
```
