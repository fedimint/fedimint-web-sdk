# Redeem Ecash

### `mint.redeemEcash(notes: string)`

Redeem a set of ecash notes.

```ts twoslash
// @esModuleInterop
import { WalletDirector } from '@fedimint/core-web'

const director = new WalletDirector()
const wallet = await director.createWallet()

await wallet.open()

try {
  await wallet.mint.redeemEcash('01...') // [!code focus]
} catch (error) {
  console.error('Failed to redeem ecash', error)
}
```
