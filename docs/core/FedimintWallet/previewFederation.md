# previewFederation

### `previewFederation(inviteCode: string)`

Attempts to give federation details before joining Federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

const details = await fedimintWallet.previewFederation('fed123...')
```
