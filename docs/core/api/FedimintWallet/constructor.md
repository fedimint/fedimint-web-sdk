# Constructor: FedimintWallet

Creates a new instance of FedimintWallet.

### new FedimintWallet()

> **new FedimintWallet**(`lazy`): [`FedimintWallet`]()

This constructor initializes a FedimintWallet instance, which manages communication
with a Web Worker. The Web Worker is responsible for running WebAssembly code that
handles the core Fedimint Client operations.

(default) When not in lazy mode, the constructor immediately initializes the
Web Worker and begins loading the WebAssembly module in the background. This
allows for faster subsequent operations but may increase initial load time.

In lazy mode, the Web Worker and WebAssembly initialization are deferred until
the first operation that requires them, reducing initial overhead at the cost
of a slight delay on the first operation.

#### Parameters

• **lazy**: `boolean` = `false`

If true, delays Web Worker and WebAssembly initialization
until needed. Default is false.

#### Returns

[`FedimintWallet`](constructor.md)

#### Example

```ts
// Create a wallet with immediate initialization
const wallet = new FedimintWallet()
wallet.open()

// Create a wallet with lazy initialization
const lazyWallet = new FedimintWallet(true)
// Some time later...
lazyWallet.initialize()
lazyWallet.open()
```

#### Defined in

[FedimintWallet.ts:63](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L63)
