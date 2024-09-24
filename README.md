![License](https://img.shields.io/github/license/fedimint/fedimint-web-sdk)
![NPM Version (latest)](https://img.shields.io/npm/v/%40fedimint%2Fcore-web)
![NPM Version (canary)](https://img.shields.io/npm/v/%40fedimint%2Fcore-web/canary)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/.github%2Fworkflows%2Fdeploy-preview.yml?label=example%20deployed%20to%20github%20pages&link=https%3A%2F%2Ffedimint.github.io%2Ffedimint-web-sdk%2F)
![Release Workflow](https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/.github%2Fworkflows%2Fchangesets.yml?label=release%20workflow)

# Fedimint Web SDK Monorepo

## THIS IS A WORK IN PROGRESS AND NOT READY FOR USE

### Structure

This monorepo is structured as a pnpm workspace. There are some helpful scripts in the root `package.json` to help manage the workspace.

```bash
fedimint-web-sdk
├── README.md
├── examples
│   ├── vite-core
│   └── bare-js
└── packages
    ├── core-web
    ├── react
    ├── wasm-web
    └── wasm-bundler
```

### Packages

- [`core-web`](./packages/core-web/README.md): Provides a typescript interface for the Fedimint client wasm.
- `react`: TBD - React components and hooks for interacting with the Fedimint client
- [`wasm-web`](./packages/wasm-web/README.md): Not intended for direct use. Contains the wasm pack output (target web) for the Fedimint client wasm.
- [`wasm-bundler`](./packages/wasm-bundler/README.md): Not intended for direct use. Contains the wasm pack output (target bundler) for the Fedimint client wasm.

### Examples

- [`vite-core`](./examples/vite-core/README.md): Simple example of how to use the `core-web` package within a React app bundled with Vite [(demo)](https://fedimint.github.io/fedimint-web-sdk/)

### Credit

Used the [wagmi](https://github.com/wevm/wagmi) library as a reference for the repo's structure.
