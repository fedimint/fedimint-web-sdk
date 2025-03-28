# @fedimint/core-web

## 0.0.11

### Patch Changes

- c422b01: Bump Deps - vitest, secp256k1, happy-dom, vite
- c5236d8: Fixed CI with self-hosted runners @elserion

## 0.0.10

### Patch Changes

- 21f94f9: Added optional timeout parameter to lightning.waitForReceive()
  Added lightning.waitForSend()
- 9468ef5: Rename amount fields to include units: (e.g., amountMsats)

## 0.0.9

### Patch Changes

- 7b67b6d: Fix PayType

## 0.0.8

### Patch Changes

- e50ec77: Added Nix devshell to run Devimint within testing suite
- d1ad74c: Changed default "expiry" for ecash spends to 1 day

## 0.0.7

### Patch Changes

- cc9a50b: declare worker message types
- Updated dependencies [d0a7432]
  - @fedimint/fedimint-client-wasm-bundler@0.0.2

## 0.0.6

### Patch Changes

- 3a08209: Fix mint bugs

## 0.0.5

### Patch Changes

- ec6f0c2: Separated wasm dependecies into their own packages
- 6aae407: Added cursory documentation `/docs`
- 27d42ad: Added Example projects to docs containing Stackblitz previews
- 908129f: Added TestingService for exposing internal state during tests. Added a bunch of tests.
- ada54ce: Shortened lightning function names to omit "Bolt11". (createBolt11Invoice --> createInvoice
- 20a2783: Added a docs website powered by vitepress
- a091101: Added debug logging with configurable logging levels
- Updated dependencies [ec6f0c2]
  - @fedimint/fedimint-client-wasm-bundler@0.0.1

## 0.0.4

### Patch Changes

- 012e4a1: Added workflows for pull request checks including calculating the compressed size of packages
- 779e924: Set up vitest testing framework
- 3038557: Refactor FedimintWallet into many composable services"

## 0.0.3

### Patch Changes

- 2185071: Moved wasm instantiation off the main thread and onto a web worker
- ad4cf7b: Fix Lightning Gateway selection
- 0f68de2: Replaced wasm pack artifact with a build using --target = bundler (instead of web)
- 2185071: Fixed types of new RPCs
- 0f68de2: Fixed bundling behavior
- 998b33a: Updated Readmes with working usage instructions

## 0.0.2

### Patch Changes

- 41bd257: Added remaining RPCs from fedimintClientWasm to FedimintWallet
- 41bd257: Implemented type type system for rpcs
- bc61eff: Implement rollup for building library
- 26b9ad4: Bump wasm - Adds unsubscribe to streams
- 26b9ad4: Implemented unsubscribe for streaming rpcs
- 9c6e2fc: Updated READMEs & usage guides

## 0.0.1

### Patch Changes

- b15fcc7: Rename Package
- b15fcc7: Testing version pump & release
