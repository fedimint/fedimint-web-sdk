# previewFederation

### `previewFederation(inviteCode: string)`

Attempts to give federation details before joining Federation.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()

const details = await director.previewFederation('fed123...') // [!code focus]
```
