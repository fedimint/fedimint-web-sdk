# Getting Started

::: danger READ THIS FIRST (Disclaimer)

This is very new. It is still a work in progress and should not be used for any serious applications. The api's are not settled and may change often.
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

## Setup

This package relies on a [wasm](https://webassembly.org/) module to be bundled with your application. You will likely need to update your bundler's or framework's configuration to load the wasm file. Setup guides for popular frameworks are coming soon.

See the [Framework Setup](#framework-setup) section for more information.

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

## Framework Setup

### Next.js

::: details Next.js Setup

:::

### React

::: details React.js Setup

:::

### VanillaJS

::: details VanillaJS Setup

:::

### Svelte

::: details Svelte Setup

:::

### Webpack

::: details Webpack Setup

:::

### Vite

::: details Vite Setup

:::

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
