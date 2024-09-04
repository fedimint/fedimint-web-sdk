# Fedimint Typescript Monorepo

## THIS IS A WORK IN PROGRESS AND NOT READY FOR USE

### Structure

This monorepo is structured as a pnpm workspace. There are some helpful scripts in the root `package.json` to help manage the workspace.

There two main folders are:

- `packages`: Contains the actual libraries
- `examples`: Contains examples of how to use the libraries

### Packages

- [`fedimint-web`](./packages/fedimint-web/README.md): Provides a typescript interface for the Fedimint client wasm
- `fedimint-react`: TBD

### Examples

- [`vite-core`](./examples/vite-core/README.md): Wrapper around `fedimint-client-wasm` that provides a typescript interface for the Fedimint client

### Credit

Used the [wagmi](https://github.com/wevm/wagmi) library as a reference for the repo's structure.
