# joinFederation

### `joinFederation(federationId: string)`

Attempts to join a federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

const didJoin = await wallet.joinFederation('fed123...') // [!code focus]

if (didJoin) {
  const balance = await wallet.balance.getBalance()
}
```

To support multiple wallets within a single application, you can pass in a custom client name.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

const didJoin = await wallet.joinFederation('fed456...', 'my-client-name') // [!code focus]
```
