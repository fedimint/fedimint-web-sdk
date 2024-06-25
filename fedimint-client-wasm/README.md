# Fedimint Client Wasm

## THIS IS A WORK IN PROGRESS AND NOT READY FOR USE

This package contains a WASM bundle with typescript bindings for the the Fedimint client (should NOT be used directly)

### Usage

```ts
import initFedimint, { FedimintClient } from 'fedimint-client-wasm';

initFedimint();

const wasm = await FedimintClient.join_federation('[federation invite code]');

wasm.rpc('client', 'get_balance', 'null', (res: string) => {
  console.log('Balance:', JSON.parse(res));
})
```
