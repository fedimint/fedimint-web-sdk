# FedimintWallet Overview

The `FedimintWallet` class serves as the main entry point for the library. It orchestrates the various services and the WorkerClient.

::: info
Check out the [Getting Started](../getting-started) guide to get started using the Fedimint Web SDK.
:::

<img src="/architecture-diagram.svg" alt="Architecture" />

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

### parseInviteCode()

> **parseInviteCode**(`inviteCode`): `Promise`\<`{ url: string; federation_id: string }`\>

#### Parameters

• **inviteCode**: `string`

#### Returns

`Promise`\<`{ url: string; federation_id: string }`\>

#### Defined in

[FedimintWallet.ts:147](https://github.com/fedimint/fedimint-web-sdk/tree/main/packages/core-web/src/FedimintWallet.ts#L147)

---

### parseBolt11Invoice()

> **parseBolt11Invoice**(`invoiceStr`): `Promise`\<`{ amount: number; expiry: number; memo: string }`\>

#### Parameters

• **invoiceStr**: `string`

#### Returns

`Promise`\<`{ amount: number; expiry: number; memo: string }`\>

#### Defined in

[FedimintWallet.ts:157](https://github.com/fedimint/fedimint-web-sdk/tree/main/packages/core-web/src/FedimintWallet.ts#157)

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

### previewFederation(inviteCode)

> **previewFederation**(`inviteCode`): `Promise`\<`{ config: string; federation_id: string }`\>

#### Parameters

• **inviteCode**: `string`

#### Returns

`Promise`\<`{ config: string; federation_id: string }`\>

#### Defined in

[FedimintWallet.ts:141](https://github.com/fedimint/fedimint-web-sdk/tree/main/packages/core-web/src/FedimintWallet.ts#L141)

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
