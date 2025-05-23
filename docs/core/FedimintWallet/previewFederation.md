# previewFederation

### `previewFederation(inviteCode: string)`

Attempts to give federation details before joining Federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

const details = await wallet.previewFederation('fed123...')
```
