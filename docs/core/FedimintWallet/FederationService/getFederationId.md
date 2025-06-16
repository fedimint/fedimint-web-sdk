# Get Federation ID

### `federation.getFederationId()`

Access the `federationId` of the connected Federation.

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()
await wallet.joinFederation('fed11qgq...')

const config = await wallet.federation.getFederationId() // [!code focus]
```
