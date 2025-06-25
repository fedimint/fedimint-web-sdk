# Join Federation

### `joinFederation(federationId: string)`

Attempts to join a federation.

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed123...') // [!code focus]

const balance = await wallet.balance.getBalance()
```

To support multiple wallets within a single application, you can pass in a custom wallet ID:

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed456...', 'my-wallet-id') // [!code focus]
```
