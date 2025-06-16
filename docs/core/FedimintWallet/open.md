# Open Wallet

### `openWallet(walletId)`

Open an existing wallet by its ID. The wallet must have been previously created and stored.

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

// First, get a list of all available wallet pointers
const ClientList = fedimintWallet.listClients()

console.log('Available wallets:')
ClientList.forEach((pointer) => {
  console.log(`- ID: ${pointer.id}`)
  console.log(`  Federation: ${pointer.federationId || 'Not joined'}`)
  console.log(`  Created: ${new Date(pointer.createdAt).toLocaleString()}`)
  console.log(
    `  Last accessed: ${new Date(pointer.lastAccessedAt).toLocaleString()}`,
  )
})

// Check if a specific wallet exists before trying to open it
const walletId = 'my-wallet-id'
if (fedimintWallet.hasWallet(walletId)) {
  const wallet = await fedimintWallet.openWallet(walletId)
  console.log(`Opened wallet: ${wallet.id}`)
} else {
  console.error('wallet does not exists, Please create a new one instead')
}
```

#### Parameters

• **walletId**: `string`

The ID of the wallet to open. Must be an existing wallet that was previously created.

#### Returns

`Promise<Wallet>`

The opened wallet instance.

#### Throws

`Error` if the wallet with the specified ID does not exist in storage.

---

```
---

## Related Methods

- [`createWallet()`](createWallet.md) - Create a new wallet
- [`ListClients()`](ListClients.md) - Get metadata for all stored wallets
- [`hasWallet()`](hasWallet.md) - Check if a wallet exists
- [`getWallet()`](getWallet.md) - Get an already loaded wallet instance
```
