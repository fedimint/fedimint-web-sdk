# Get Federation ID

### `federation.getFederationId()`

Access the `federationId` of the connected Federation.

```ts twoslash
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const federationId = await wallet.federation.getFederationId() // [!code focus]
```
