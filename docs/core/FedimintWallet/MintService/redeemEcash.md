# Redeem Ecash

### `mint.redeemEcash(notes: string)`

Redeem a set of ecash notes.

```ts twoslash
// @esModuleInterop
import { initialize, joinFederation } from '@fedimint/core-web'

await initialize()
const wallet = await joinFederation('fed11qgq...')

try {
  await wallet.mint.redeemEcash('01...') // [!code focus]
} catch (error) {
  console.error('Failed to redeem ecash', error)
}
```
