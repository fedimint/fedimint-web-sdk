# FedimintWallet Instance

::: warning Breaking Change
The `FedimintWallet` class now uses a singleton pattern. Use `FedimintWallet.getInstance()` instead of `new FedimintWallet()`.
:::

## getInstance()

### `FedimintWallet.getInstance(createTransport?: TransportFactory)`

Gets or creates the singleton FedimintWallet instance.

#### Returns

[`FedimintWallet`](index.md)

The singleton FedimintWallet instance.

#### Example

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

// Get the singleton instance
const fedimintWallet = FedimintWallet.getInstance()

// The same instance is returned on subsequent calls
const sameInstance = FedimintWallet.getInstance()
console.log(fedimintWallet === sameInstance) // true

// Create and manage wallets
const wallet = await fedimintWallet.createWallet()
```

## Legacy Constructor (Deprecated)

### `new FedimintWallet(createTransport?: TransportFactory)`

::: danger Deprecated
Direct instantiation with `new FedimintWallet()` is deprecated. Use `FedimintWallet.getInstance()` instead.
:::

The constructor is now private. Use the static `getInstance()` method instead.

#### Migration Example

```ts twoslash
// @errors: 2673
import { FedimintWallet } from '@fedimint/core-web'

// ❌ Deprecated - Don't use
const wallet = new FedimintWallet()

// ✅ Recommended - Use this instead
const fedimintWallet = FedimintWallet.getInstance()
```
