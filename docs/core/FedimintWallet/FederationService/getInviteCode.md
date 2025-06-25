# Get Invite Code

### `federation.getInviteCode()`

Access the invite code for the connected federation.

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

const peerId = 0 // Index of the guardian to ask for the invite code // [!code focus]

const inviteCode = await wallet.federation.getInviteCode(peerId) // [!code focus]
```
