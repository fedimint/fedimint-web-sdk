# Wallet State

`Wallet` instances always represent opened wallets that are connected to a federation. There is no need to check if a wallet is "open" - if you have a `Wallet` instance, it's ready to use.

```ts twoslash
// @esModuleInterop
import { initialize, getWallet, joinFederation } from '@fedimint/core-web'

await initialize()

// Get an existing wallet - if it exists, it's ready to use
const wallet = getWallet('my-wallet-id')

if (wallet) {
  // Wallet is always ready - no need to check isOpen()
  const balance = await wallet.balance.getBalance()
  console.log(`Federation ID: ${wallet.federationId}`)
} else {
  // Create a new wallet - it will be opened automatically
  const newWallet = await joinFederation('fed123...', 'my-wallet-id')
  // newWallet is now ready to use immediately
  const balance = await newWallet.balance.getBalance()
}
```

## Key Points

- `Wallet` instances are always in an "opened" state
- No need to call any "open" methods on a `Wallet` instance
- If `getWallet()` returns a wallet, it's ready to use
- If `joinFederation()` or `openWallet()` succeed, the returned wallet is ready to use
- All wallet operations (balance, mint, lightning, etc.) are available immediately
