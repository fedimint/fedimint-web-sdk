# Open Wallet

### `openWallet(walletId)`

Open an existing wallet by its ID. The wallet must have been previously created and stored.

```ts twoslash
import {
  initialize,
  listClients,
  hasWallet,
  openWallet,
} from '@fedimint/core-web'

await initialize()

// First, get a list of all available wallet metadata
const clientList = listClients()

console.log('Available wallets:')
clientList.forEach((walletInfo) => {
  console.log(`- ID: ${walletInfo.id}`)
  console.log(`  Federation: ${walletInfo.federationId || 'Not joined'}`)
  console.log(`  Created: ${new Date(walletInfo.createdAt).toLocaleString()}`)
  console.log(
    `  Last accessed: ${new Date(walletInfo.lastAccessedAt).toLocaleString()}`,
  )
})

// Check if a specific wallet exists before trying to open it
const walletId = 'my-wallet-id'
if (hasWallet(walletId)) {
  const wallet = await openWallet(walletId)
  console.log(`Opened wallet: ${wallet.id}`)
} else {
  console.error('wallet does not exist, Please create a new one instead')
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
