# Fedimint Typescript Monorepo

## THIS IS A WORK IN PROGRESS AND NOT READY FOR USE

### Structure

This monorepo is structured as a pnpm workspace. There are some helpful scripts in the root `package.json` to help manage the workspace.

There two main folders are:

- `packages`: Contains the actual libraries
- `playgrounds`: Contains examples of how to use the libraries

Used the [wagmi](https://github.com/wevm/wagmi) library as a reference for the package structure.

### Packages

- [`fedimint-client-wasm`](./packages/fedimint-client-wasm/README.md): Contains a WASM bundle with typescript bindings for the the Fedimint client (should NOT be used directly)
- [`fedimint-client-web`](./packages/fedimint-client-ts/README.md): Wrapper around `fedimint-client-wasm` that provides a typescript interface for the Fedimint client
- `fedimint-react`: TBD

### Playground
