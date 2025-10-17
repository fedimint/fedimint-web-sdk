# @fedimint/transport-react-native

Transport layer for React Native that bridges `@fedimint/core` with the native Fedimint client via UniFFI.

## Overview

This package provides the transport layer that allows `@fedimint/core` to communicate with the Fedimint Rust client in React Native apps. It implements the `Transport` interface and uses UniFFI-generated bindings to call native code.

## Architecture

```
@fedimint/core (TypeScript)
    ↓
TransportClient
    ↓
RNTransport (this package)
    ↓
UniFFI Bindings (@fedimint/react-native)
    ↓
Rust RpcHandler
```

## Differences from Web Transport

### Web (`@fedimint/transport-web`)

- Uses a Web Worker for WASM execution
- Asynchronous message passing via `postMessage`
- WASM runs in separate thread

### React Native (this package)

- Direct native calls via UniFFI (no worker needed)
- Native code runs on native threads managed by React Native
- Callback-based RPC calls
- Synchronous FFI calls, async handled by Rust callbacks

## License

MIT
