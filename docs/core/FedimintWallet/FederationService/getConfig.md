# Get Federation Config

### `federation.getConfig()`

Access configuration details about a connected federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()
await wallet.joinFederation('fed11qgq...')
await wallet.open()

const config = await wallet.federation.getConfig() // [!code focus]
```

#### Returns

`Promise<FederationConfig>`

The federation configuration object.
