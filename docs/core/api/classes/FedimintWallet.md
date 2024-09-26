[Core Web](../globals.md) / FedimintWallet

# Class: FedimintWallet

## Constructors

### new FedimintWallet()

> **new FedimintWallet**(`lazy`): [`FedimintWallet`](FedimintWallet.md)

Creates a new instance of FedimintWallet.

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

<!-- [`FedimintWallet`](/core/api/FedimintWallet) -->

`FedimintWallet`

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

## Properties

### balance

> **balance**: `BalanceService`

#### Defined in

[FedimintWallet.ts:18](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L18)

---

### federation

> **federation**: `FederationService`

#### Defined in

[FedimintWallet.ts:21](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L21)

---

### lightning

> **lightning**: `LightningService`

#### Defined in

[FedimintWallet.ts:20](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L20)

---

### mint

> **mint**: `MintService`

#### Defined in

[FedimintWallet.ts:19](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L19)

---

### recovery

> **recovery**: `RecoveryService`

#### Defined in

[FedimintWallet.ts:22](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L22)

## Methods

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

This should ONLY be called when UNLOADING the wallet client.
After this call, the FedimintWallet instance should be discarded.

#### Returns

`Promise`\<`void`\>

#### Defined in

[FedimintWallet.ts:134](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L134)

---

### initialize()

> **initialize**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[FedimintWallet.ts:85](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L85)

---

### isOpen()

> **isOpen**(): `boolean`

#### Returns

`boolean`

#### Defined in

[FedimintWallet.ts:140](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L140)

---

### joinFederation()

> **joinFederation**(`inviteCode`, `clientName`): `Promise`\<`void`\>

#### Parameters

• **inviteCode**: `string`

• **clientName**: `string` = `DEFAULT_CLIENT_NAME`

#### Returns

`Promise`\<`void`\>

#### Defined in

[FedimintWallet.ts:110](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L110)

---

### open()

> **open**(`clientName`): `Promise`\<`any`\>

#### Parameters

• **clientName**: `string` = `DEFAULT_CLIENT_NAME`

#### Returns

`Promise`\<`any`\>

#### Defined in

[FedimintWallet.ts:96](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L96)

---

### setLogLevel()

> **setLogLevel**(`level`): `void`

Sets the log level for the library.

#### Parameters

• **level**: `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"none"`

The desired log level ('DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE').

#### Returns

`void`

#### Defined in

[FedimintWallet.ts:148](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L148)

---

### waitForOpen()

> **waitForOpen**(): `Promise`\<`null` \| `void`\>

#### Returns

`Promise`\<`null` \| `void`\>

#### Defined in

[FedimintWallet.ts:91](https://github.com/fedimint/fedimint-web-sdk/blob/451b02527305a23fec3a269d39bde9a3ec377df2/packages/core-web/src/FedimintWallet.ts#L91)
