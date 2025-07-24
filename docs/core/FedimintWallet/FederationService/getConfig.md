# Get Federation Config

### `federation.getConfig()`

Access configuration details about a connected federation.

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const config = await wallet.federation.getConfig() // [!code focus]
```

#### Returns

`Promise<FederationConfig>`

The federation configuration object.
