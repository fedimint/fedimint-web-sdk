# Redeem Ecash

### `federation.getInviteCode()`

Access the invite code for the connected federation.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const peerId = 0 // Index of the guardian to ask for the invite code // [!code focus]

const inviteCode = await wallet.federation.getInviteCode(peerId) // [!code focus]
```
