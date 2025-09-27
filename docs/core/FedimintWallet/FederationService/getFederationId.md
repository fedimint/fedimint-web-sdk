# Redeem Ecash

### `federation.getFederationId()`

Access the `federationId` of the connected Federation.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()
const wallet = await director.createWallet()

await wallet.open()

const config = await wallet.federation.getFederationId() // [!code focus]
```
