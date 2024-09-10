![NPM Version](https://img.shields.io/npm/v/%40fedimint%2Fcore-web)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/.github%2Fworkflows%2Fdeploy-preview.yml?label=example%20deployed%20to%20github%20pages&link=https%3A%2F%2Ffedimint.github.io%2Ffedimint-web-sdk%2F)
![Release Workflow](https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/.github%2Fworkflows%2Frelease.yml?label=release%20workflow)

<!-- ![NPM Version (canary)](https://img.shields.io/npm/v/%40fedimint%2Fcore-web/canary) -->

# Fedimint Web SDK Monorepo

## THIS IS A WORK IN PROGRESS AND NOT READY FOR USE

### Structure

This monorepo is structured as a pnpm workspace. There are some helpful scripts in the root `package.json` to help manage the workspace.

There two main folders are:

- `packages`: Contains the actual libraries
- `examples`: Contains examples of how to use the libraries

### Packages

- [`core-web`](./packages/core-web/README.md): Provides a typescript interface for the Fedimint client wasm
- `react`: TBD

### Examples

- [`vite-core`](./examples/vite-core/README.md): Wrapper around `fedimint-client-wasm` that provides a typescript interface for the Fedimint client

### Credit

Used the [wagmi](https://github.com/wevm/wagmi) library as a reference for the repo's structure.
