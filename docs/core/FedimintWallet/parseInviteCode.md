# parseInviteCode

### `parseInviteCode(inviteCode: string)`

Parses an invite code and extracts its components (`federationId` and `url`) **without joining the federation**.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

const result = await wallet.parseInviteCode('fed11.......') // [!code focus]

console.log(result)
// Output: { federation_id: 'fed123', url: 'wss://fm_url......' }
```
