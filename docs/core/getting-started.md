# Getting Started

::: danger Disclaimer
This is very new. Use with caution. [Report bugs](https://github.com/fedimint/fedimint-web-sdk/issues).

APIs may change.
:::

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

Check out the [nextjs sample app](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/nextjs) for a full working example.

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

```bash [pnpm]
# Required
pnpm add vite-plugin-wasm

# Typically not needed, but may be required in some projects.
pnpm add vite-plugin-top-level-await
```

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

## Usage

Here's a basic example of how to use the `@fedimint/core-web` library:

::: code-group

```ts twoslash [example.ts]
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
  // notwoslash
  console.log('Updated balance:', balance)
})
// Remember to call unsubscribe() when done

// Receive Ecash Payments
await wallet.mint.redeemEcash('A11qgqpw9thwvaz7t...')

// Create Lightning Invoice
await wallet.lightning.createInvoice(10_000, 'description')

// Pay Lightning Invoice
await wallet.lightning.payInvoice('lnbc...')
```

:::

## Examples

Check out an example app using [Vite + React example](../examples/vite-react.md).

Check out an example app using [VanillaJS + HTML](../examples/bare-js.md).

## Resources

For a list of public federations with invite codes, visit [Bitcoin Mints](https://bitcoinmints.com/?tab=mints&showFedimint=true).

## What's Next?

#### Check out the Example Projects

- [Vite + React](../examples/vite-react.md)
- [VanillaJS + HTML example](../examples/bare-js.md)

<br>

#### To learn more about Web SDK, explore the docs

- [SDK Overview](overview)
- [Library Architecture](architecture)
- [API Reference](FedimintWallet/index)
