# @fedimint/core-web

### THIS IS A WORK IN PROGRESS AND NOT READY FOR SERIOUS USE

This package provides a typescript interface for a fedimint client in the browser.

Bundles the wasm-pack output of the rust-based [fedimint client](https://github.com/fedimint/fedimint/tree/master/fedimint-client-wasm).

## Installation

```bash
// npm or yarn or pnpm
pnpm add @fedimint/core-web
```

## Setup

This package relies on the wasm binary to be bundled with your application. You will likely need to update your bundler's or framework's configuration to load the wasm file. Setup guides for popular frameworks are coming soon.

See the `vite.config.ts` file in the [vite-core example](../../examples/vite-core/vite.config.ts) for an example of configuring wasm with Vite.

## Usage

```ts
import { FedimintWallet } from '@fedimint/core-web'

// Create the Wallet client
const wallet = new FedimintWallet()

// This should be called only once in the application
// lifecycle. It will automatically load your saved
// wallet state from previous sessions.
await wallet.open()

// Join a Federation
const inviteCode = 'fed11qgqpw9thwvaz7t...' // Federation invite code
await wallet.joinFederation(inviteCode)
// After you've joined a federation, your federation state
// will be stored in the browser. Future calls to `open()`
// will automatically load your saved federation.

// Get Wallet Balance (sync)
const balance = await wallet.getBalance()

// Get Wallet Balance (stream)
// Make sure to call `unsubscribe()` when you're done
const unsubscribe = wallet.subscribeBalance((balance: number) => {
  console.log('updated balance', balance)
})

// Receive Ecash Payments
await wallet.reissueNotes('A11qgqpw9thwvaz7t...')

// Pay Lightning Invoice
await wallet.payBolt11Invoice('lnbc...')
```

## Check out the example

[`examples/vite-core`](../../examples/vite-core/README.md)
