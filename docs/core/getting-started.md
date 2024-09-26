# Getting Started

## Overview

@fedimint/core-web is a VanillaJS library for running a fedimint client in the browser. It provides a WebAssembly-powered client that exposes the robust, fault-tolerant fedimint-client (built in Rust) via WebAssembly.

## Installation

To add @fedimint/core-web to your project, install the package using your preferred package manager:

::: code-group

```bash [pnpm]
pnpm add @fedimint/core-web
```

```bash [npm]
npm install @fedimint/core-web
```

```bash [yarn]
yarn add @fedimint/core-web
```

```bash [bun]
bun add @fedimint/core-web
```

:::

## Setup

This package relies on the WebAssembly binary to be bundled with your application. You will likely need to update your bundler's or framework's configuration to load the WASM file. Setup guides for popular frameworks are coming soon.

For an example of configuring WASM within a web-worker using Vite, check out the `vite.config.ts` file in the [vite-core example](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/vite-core/vite.config.ts).

## Usage

Here's a basic example of how to use the @fedimint/core-web library:

::: code-group

```tsx [index.ts]
import { FedimintWallet } from '@fedimint/core-web'

// Create the Wallet client
const wallet = new FedimintWallet()

// Open the wallet (should be called once in the application lifecycle)
await wallet.open()

// Join a Federation (if not already open)
if (!wallet.isOpen()) {
  const inviteCode = 'fed11qgqpw9thwvaz7t...'
  await wallet.joinFederation(inviteCode)
}

// Get Wallet Balance
const balance = await wallet.balance.getBalance()

// Subscribe to Balance Updates
const unsubscribe = wallet.balance.subscribeBalance((balance: number) => {
  console.log('Updated balance:', balance)
})
// Remember to call unsubscribe() when done

// Receive Ecash Payments
await wallet.mint.reissueNotes('A11qgqpw9thwvaz7t...')

// Pay Lightning Invoice
await wallet.lightning.payBolt11Invoice('lnbc...')
```

:::

## Examples

Check out the Vite + React example in the [`examples/vite-core`](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/vite-core) directory. You can also view a live demo [here](https://fedimint.github.io/fedimint-web-sdk/).

## Resources

For a list of public federations with invite codes, visit [Bitcoin Mints](https://bitcoinmints.com/?tab=mints&showFedimint=true).

## Next Steps

To learn more about @fedimint/core-web and how to use it effectively in your projects, explore the following topics:

- **API Reference**: Browse the collection of available methods and learn how to use them.
- **Advanced Usage**: Discover more complex scenarios and best practices for using @fedimint/core-web.
- **Framework Integration**: Learn how to integrate @fedimint/core-web with popular front-end frameworks.
