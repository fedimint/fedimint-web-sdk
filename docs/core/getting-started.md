# Getting Started

Welcome to the Fedimint Web SDK! This guide will help you get started with integrating Fedimint into your web application.

::: danger Disclaimer
This is very new. Use with caution. [Report bugs](https://github.com/fedimint/fedimint-web-sdk/issues).
Welcome to the Fedimint Web SDK! This guide will help you get started with integrating Fedimint into your web application.

APIs may change.
:::

## Scaffolding your first project

::: tip Compatibility Note
Most `create-fedimint-app` templates require [Node.js](https://nodejs.org/en/) version 18+ or 20+.
:::

## Installation

::: code-group

```bash [npm]
npm install @fedimint/core-web
```

```bash [yarn]
yarn add @fedimint/core-web
```

```bash [pnpm]
pnpm add @fedimint/core-web
```

```bash [bun]
bun add @fedimint/core-web
```

:::

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold a Fedimint + React project, run:

::: code-group

```bash [npm]
npm create fedimint-app@latest my-fedimint-app -- --template vite-react-ts
```

```bash [yarn]
yarn create fedimint-app my-fedimint-app --template vite-react-ts
```

```bash [pnpm]
pnpm create fedimint-app my-fedimint-app --template vite-react-ts
```

```bash [bun]
bun create fedimint-app my-fedimint-app --template vite-react-ts
```

:::

See [create-fedimint-app](https://github.com/fedimint/fedimint-web-sdk/tree/main/packages/create-fedimint-app) for more details on each supported template.

## Usage

Here's a basic example of how to use the `@fedimint/core-web` library with the functional API:

::: code-group

```ts twoslash [example.ts]
import {
  initialize,
  joinFederation,
  openWallet,
  getWallet,
  getActiveWallets,
} from '@fedimint/core-web'

// Initialize the SDK first
await initialize()

// Create a new wallet and join a federation
const inviteCode = 'fed11qgqpw9thwvaz7t...'
const wallet = await joinFederation(inviteCode)

// Get Wallet Balance
const balance = await wallet.balance.getBalance()

// Subscribe to Balance Updates
const unsubscribe = wallet.balance.subscribeBalance((balance: number) => {
  console.log('Updated balance:', balance)
  // balance is in mSats - 1000 mSats = 1 satoshi
})
// Remember to call unsubscribe() when done

// Working with multiple wallets
const wallet2 = await joinFederation(inviteCode, 'my-second-wallet')
const allWallets = getActiveWallets()

// Open an existing wallet by ID
const existingWallet = await openWallet('my-wallet-id')
```

```ts twoslash [multi-wallet-example.ts]
import {
  initialize,
  joinFederation,
  openWallet,
  getWalletsByFederation,
  listClients,
  getWallet,
} from '@fedimint/core-web'

// Initialize the SDK
await initialize()

// Create multiple wallets for different federations
const personalWallet = await joinFederation(
  'fed11qgqpw9thwvaz7t...',
  'personal',
)
const businessWallet = await joinFederation(
  'fed11qgqrgvnhwden5te0v9...',
  'business',
)

// Get wallets by federation
const personalFedWallets = getWalletsByFederation('federation-id-1')
const businessFedWallets = getWalletsByFederation('federation-id-2')

// List all wallet metadata
const clientList = listClients()
clientList.forEach((walletInfo) => {
  console.log(
    `Wallet ${walletInfo.id} - Federation: ${walletInfo.federationId}`,
  )
  console.log(`Created: ${new Date(walletInfo.createdAt).toLocaleString()}`)
  console.log(
    `Last accessed: ${new Date(walletInfo.lastAccessedAt).toLocaleString()}`,
  )
})

// Get a specific wallet
const myWallet = getWallet('personal')
if (myWallet) {
  const balance = await myWallet.balance.getBalance()
  console.log('Personal wallet balance:', balance)
}
```

:::

## Framework Setup

This package relies on a [wasm](https://webassembly.org/) module to be bundled with your application. You will likely need to update your bundler's or framework's configuration to load the wasm file.

See setup guides for some popular choices below. If your tool is not listed or the setup does not work, feel free to [open an issue](https://github.com/fedimint/fedimint-web-sdk/issues/new) or [contribute a guide](https://github.com/fedimint/fedimint-web-sdk/edit/main/docs/core/getting-started.md).

### Next.js

::: details Next.js Setup

To use wasm in a Next.js project, you'll need to add the following to your `next.config.ts` file:

::: code-group

```ts{5-12} [next.config.ts]
/** @type {import('next').NextConfig} */

const nextConfig = {

  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },

};

export default nextConfig;
```

Check out the [nextjs sample app](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/next-js) for a full working example.

:::

### React

::: details React.js Setup

TODO: Add setup guide for React.js

Will be similar to Next.js setup above... perhaps even simpler.

:::

### VanillaJS

::: details VanillaJS Setup

TODO: Add setup guide for vanilla js.

Currently requires modifying the library and utilizing the `@fedimint/wasm-web` package directly.

See the [bare-js sample app](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/bare-js) for a full working example.

:::

### Webpack

::: details Webpack Setup

TODO: Verify this setup still works.

To use wasm in a webpack project, you'll need to modify your webpack configuration file.

::: code-group

```ts{2-5} [webpack.config.js]
module.exports = {
  experiments: {
      asyncWebAssembly: true,
      layers: true,
  }
}
```

:::

### Vite

::: details Vite Setup

To use wasm in a vite project, you'll need to install the `vite-plugin-wasm` plugin.

If you you see errors with top level await, you may need to install the `vite-plugin-top-level-await` plugin.

::: code-group

```bash [npm]
# Required
npm i vite-plugin-wasm

# Typically not needed, but may be required in some projects.
npm i vite-plugin-top-level-await
```

```bash [yarn]
# Required
yarn add vite-plugin-wasm

# Typically not needed, but may be required in some projects.
yarn add vite-plugin-top-level-await
```

```bash [pnpm]
# Required
pnpm add vite-plugin-wasm

# Typically not needed, but may be required in some projects.
pnpm add vite-plugin-top-level-await
```

```bash [bun]
# Required
bun add vite-plugin-wasm

# Typically not needed, but may be required in some projects.
bun add vite-plugin-top-level-await
```

Then update your `vite.config.ts` file with the following:

::: code-group

```ts{2-3,7-10,12-18,20-22} twoslash [vite.config.ts]
// @noErrors
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await' // Optional

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(), // Optional
  ],

  worker: {
    format: 'es',
    plugins: () => [
      wasm(),
      topLevelAwait(), // Optional
    ],
  },

  optimizeDeps: {
    exclude: ['@fedimint/core-web'],
  },
})
```

Check out the [vite-react sample app](../examples/vite-react) for a full working example.

:::

## Examples

Check out an example app using [Vite + React example](../examples/vite-react.md).

Check out an example app using [VanillaJS + HTML](../examples/bare-js.md).

Check out an example app using [Next.JS](../examples/next-js.md).

## Resources

For a list of public federations with invite codes, visit [Bitcoin Mints](https://bitcoinmints.com/?tab=mints&showFedimint=true).

## What's Next?

#### Check out the Example Projects

- [Vite + React](../examples/vite-react.md)
- [VanillaJS + HTML example](../examples/bare-js.md)
- [Next.JS](../examples/next-js.md)

<br>

#### To learn more about Web SDK, explore the docs

- [SDK Overview](overview)
- [Library Architecture](architecture)
- [Functional API Reference](#api-reference)

## API Reference

The `@fedimint/core-web` package exports the following functions for managing wallets:

// TODO: seperate docs for all new functions introduced

### Core Functions

#### `initialize(createTransport?: TransportFactory): Promise<void>`

Initializes the SDK. Must be called before using other functions.

#### `joinFederation(inviteCode: string, walletId?: string): Promise<Wallet>`

Creates a new wallet and joins a federation using the provided invite code.

#### `openWallet(walletId: string): Promise<Wallet>`

Opens an existing wallet by its ID.

#### `getWallet(walletId: string): Wallet | undefined`

Retrieves a wallet instance by its ID.

#### `removeWallet(walletId: string): void`

Removes a wallet and cleans up its resources.

### Multi-Wallet Management

#### `getActiveWallets(): Wallet[]`

Returns all currently active (open) wallets.

#### `getWalletsByFederation(federationId: string): Wallet[]`

Returns all wallets associated with a specific federation.

#### `listClients(): WalletInfo[]`

Lists all wallet metadata stored in local storage.

#### `getWalletInfo(walletId: string): WalletInfo | undefined`

Gets metadata for a specific wallet.

#### `hasWallet(walletId: string): boolean`

Checks if a wallet with the given ID exists.

#### `getClientName(walletId: string): string | undefined`

Gets the client name for a specific wallet.

### Utility Functions

#### `parseInviteCode(inviteCode: string): Promise<ParsedInviteCode>`

Parses a federation invite code and retrieves its details.

#### `previewFederation(inviteCode: string): Promise<PreviewFederation>`

Previews federation information without joining.

#### `parseBolt11Invoice(invoice: string): Promise<ParsedBolt11Invoice>`

Parses a BOLT11 Lightning invoice.

#### `cleanup(): Promise<void>`

Cleans up all wallets and SDK resources.

#### `clearAllWallets(): Promise<void>`

Removes all wallets and clears local storage.

#### `setLogLevel(level: LogLevel): void`

Sets the global log level for debugging.

#### `isInitialized(): boolean`

Checks if the SDK has been initialized.

### Classes

#### `Wallet`

The main wallet class that provides access to balance, lightning, mint, federation, and recovery services.
