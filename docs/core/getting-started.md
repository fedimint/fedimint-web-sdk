# Getting Started

::: danger READ THIS FIRST (Disclaimer)

This is very new. It is still a work in progress and should not be used for any serious applications. The api's are not settled and may change often.
:::

[[toc]]

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

### Webpack

::: details Webpack Setup

TODO: Verify this setup still works.

To use wasm in a webpack project, you'll need to modify your webpack configuration file.

::: code-group

```ts{2-5} [webpack.config.js]
module.exports = {
  experiments = {
      asyncWebAssembly: true,
      layers: true,
  }
}
```

:::

### Vite

::: details Vite Setup

To use wasm in a vite project, you'll need to install the `vite-plugin-wasm` plugin.

```bash
pnpm add vite-plugin-wasm
```

Then update your `vite.config.ts` file with the following:

::: code-group

```ts{1,5,7-10} [vite.config.ts]
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm()], // required for wasm

  worker: {
    format: 'es',
    plugins: () => [wasm()],
  },
})
```

Check out the [vite-core sample app](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/vite-core) for a full working example.

:::

## Usage

Here's a basic example of how to use the `@fedimint/core-web` library:

::: code-group

```ts [main.ts]
import { wallet } from '@fedimint/core-web'

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

- **API Reference**: Browse the collection of available methods and learn how to use them.
- **Advanced Usage**: Discover more complex scenarios and best practices for using @fedimint/core-web.
- **Framework Integration**: Learn how to integrate @fedimint/core-web with popular front-end frameworks.

## What's Next?

- To see the sdk in action, check out the [examples](../examples)
- To learn more about @fedimint/core-web and how to use it effectively in your projects, explore the following topics:
  - [Overview](./overview.md)
  - [API Reference](./api/index.md)
  - [Architecture](./architecture.md)
- Vite + React: [`examples/vite-core`](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/vite-core) [(demo)](https://fedimint.github.io/fedimint-web-sdk/)
- VanillaJS + HTML example: [`examples/bare-js`](https://github.com/fedimint/fedimint-web-sdk/tree/main/examples/bare-js)
