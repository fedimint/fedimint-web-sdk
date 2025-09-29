# parseInviteCode

### `parseInviteCode(inviteCode: string)`

Parses an invite code and extracts its components (`federationId` and `url`) **without joining the federation**.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core'
import { WasmWorkerTransport } from '@fedimint/transport-web'

const walletDirector = new WalletDirector(new WasmWorkerTransport())

const result = await walletDirector.parseInviteCode('fed11.......') // [!code focus]

console.log(result)
// Output: { federation_id: 'fed123', url: 'wss://fm_url......' }
```
