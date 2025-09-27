# Redeem Ecash

### `federation.getInviteCode()`

Access the invite code for the connected federation.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()
const wallet = await director.createWallet()

await wallet.open()

const peerId = 0 // Index of the guardian to ask for the invite code // [!code focus]

const inviteCode = await wallet.federation.getInviteCode(peerId) // [!code focus]
```
