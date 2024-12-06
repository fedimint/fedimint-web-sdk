# Redeem Ecash

### `federation.getFederationId()`

Access the `federationId` of the connected Federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const config = await wallet.federation.getFederationId() // [!code focus]
```
