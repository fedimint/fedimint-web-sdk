![GitHub License](https://img.shields.io/github/license/fedimint/fedimint-web-sdk?style=plastic&color=blue&link=https%3A%2F%2Fgithub.com%2Ffedimint%2Ffedimint-web-sdk%2Fblob%2Fmain%2FLICENSE)
![NPM Version (latest)](<https://img.shields.io/npm/v/%40fedimint%2Fcore-web?style=plastic&logo=npm&logoColor=rgb(187%2C%2054%2C%2057)&label=%40fedimint%2Fcore-web&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40fedimint%2Fcore-web>)
![Docs Workflow](https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/deploy-docs.yml?style=plastic&label=Docs%20Site&color=%2303b1fc&link=https%3A%2F%2Fweb.fedimint.org%2F)
![Release Workflow](https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/.github%2Fworkflows%2Fchangesets.yml?style=plastic&label=Test%20%26%20Release&color=green)

# Fedimint Web SDK Monorepo

### Docs Site: [web.fedimint.org](https://web.fedimint.org)

---

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

- [`core-web`](https://web.fedimint.org/docs/core/getting-started): Provides a typescript interface for the Fedimint client wasm.
- `react`: TBD - React components and hooks for interacting with the Fedimint client
- [`wasm-web`](../packages/wasm-web/README.md): Not intended for direct use. Contains the wasm pack output (target web) for the Fedimint client wasm.
- [`wasm-bundler`](../packages/wasm-bundler/README.md): Not intended for direct use. Contains the wasm pack output (target bundler) for the Fedimint client wasm.

### Examples

- [`vite-core`](../examples/vite-core/README.md): Simple example of how to use the `core-web` package within a React app bundled with Vite.
- [`bare-js`](../examples/bare-js/README.md): Simple example of how to use the `core-web` package in a bare javascript environment (no bundler)

### Credit

Used the [wagmi](https://github.com/wevm/wagmi) library as a reference for the repo's structure.
