# @fedimint/core-web

This package provides a typescript interface for a fedimint client in the browser.

It contains the wasm-pack output of the rust-based [fedimint client](https://github.com/fedimint/fedimint/tree/master/fedimint-client-wasm).

::: danger Disclaimer
This is still an unstable work in progress and should not be used for any serious applications. The api's are not settled and may change often.
:::

## Key Features:

- **WebAssembly-powered Client**: Exposes the robust, fault-tolerant fedimint-client (built in Rust) via WebAssembly. Lazy-Loads within a web worker for performance.
- **eCash Payments**: Includes support for joining federations, sending/receiving eCash, and managing balances.
- **Lightning Payments**: Ships with zero-setup Lightning Network payments.
- 🛠️ **State Management**: Handles the complex state management and storage challenges for browser wallets.
- 🤫 **Privacy Included**: Offers a privacy-centric wallet by default.
- ⚙️ **Framework Agnostic**: Designed as a "core" library compatible with vanilla JavaScript, laying the groundwork for future framework-specific packages.

## Installation

```bash
// npm or yarn or pnpm
pnpm add @fedimint/core-web
```

## Setup

This package relies on the wasm binary to be bundled with your application. You will likely need to update your bundler's or framework's configuration to load the wasm file. Setup guides for popular frameworks are coming soon.

See the `vite.config.ts` file in the [vite-core example](_media/vite.config.ts) for an example of configuring wasm within a web-worker using Vite.

## Usage

```ts
import { FedimintWallet } from '@fedimint/core-web'

// Create the Wallet client
const wallet = new FedimintWallet()

// This should be called only once in the application
// lifecycle. It will automatically load your saved
// wallet state from previous sessions.
await wallet.open()

// Joining a Federation

// You can't join a federation
// if your wallet is already open
if (!wallet.isOpen()) {
  // Check out [bitcoin mints](https://bitcoinmints.com/?tab=mints&showFedimint=true) for
  // a list of federations with public invite codes.
  const inviteCode = 'fed11qgqpw9thwvaz7t...'

  await wallet.joinFederation(inviteCode)
  // After you've joined a federation, your federation state
  // will be stored in the browser. Future calls to `open()`
  // will automatically load your saved federation.
}

// Get Wallet Balance (sync)
const balance = await wallet.balance.getBalance()

// Subscribe to Balance Updates
const unsubscribe = wallet.balance.subscribeBalance((balance: number) => {
  console.log('updated balance', balance)
})
// Make sure to call `unsubscribe()` when you're done

// Receive Ecash Payments
await wallet.mint.reissueNotes('A11qgqpw9thwvaz7t...')

// Pay Lightning Invoice
await wallet.lightning.payBolt11Invoice('lnbc...')
```

### Check out the example

- Vite + React: [`examples/vite-core`](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/vite-core) [(demo)](https://fedimint.github.io/fedimint-web-sdk/)
- VanillaJS + HTML example: [`examples/bare-js`](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/bare-js)

### Resources

- [Bitcoin Mints](https://bitcoinmints.com/?tab=mints&showFedimint=true) - list of public federations with invite codes
