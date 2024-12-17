<p align="center">
  <img src="../docs/public/icon.png" alt="Fedimint Logo" width="300" />
  <!-- Removes the border below the header tag -->
  <div id="toc"><ul align="center" style="list-style: none;"><summary>
    <h1><b>Fedimint Web SDK</b></h1>
    <p>A Robust, privacy-focused, and WebAssembly-powered fedimint client for the browser.</p>
  </summary></ul></div>

  <p align="center">
    <a href="https://github.com/fedimint/fedimint-web-sdk/blob/main/LICENSE"><img src="https://img.shields.io/github/license/fedimint/fedimint-web-sdk?style=plastic&color=blue" alt="GitHub License" /></a>
    <a href="https://github.com/fedimint/fedimint-web-sdk/actions"><img src="https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/.github%2Fworkflows%2Fchangesets.yml?style=plastic&label=CI&color=green" alt="Build Status" /></a>
    <a href="https://web.fedimint.org"><img src="https://img.shields.io/github/actions/workflow/status/fedimint/fedimint-web-sdk/deploy-docs.yml?style=plastic&label=Docs%20Site&color=%2303b1fc" alt="Docs Workflow" /></a>
  </p>
  
  <!-- Removes the border below the header tag -->
  <div id="toc"><ul align="center" style="list-style: none;"><summary>
    <h2>
        Docs Site: <a href="https://web.fedimint.org">web.fedimint.org</a>
    </h2>
  </summary></ul></div>

## Packages 📦

| Package                                                                 | Version                                                                                                                                                                                                                                                                               | Description                                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`@fedimint/core-web`](https://npmjs.com/package/fedimint/core-web)     | ![NPM Version (latest)](<https://img.shields.io/npm/v/%40fedimint%2Fcore-web?style=plastic&logo=npm&logoColor=rgb(187%2C%2054%2C%2057)&label=%40fedimint%2Fcore-web>)                                                                                                                 | Typescript interface for the Fedimint client wasm                                                         |
| [`@fedimint/react`](https://web.fedimint.org/docs/core/getting-started) | ![NPM Version (latest)](<https://img.shields.io/npm/v/%40fedimint%2Freact?style=plastic&logo=npm&logoColor=rgb(187%2C%2054%2C%2057)&label=%40fedimint%2Freact>)                                                                                                                       | React components and hooks for interacting with the Fedimint client                                       |
| [`@fedimint/wasm-web`](../packages/wasm-web/README.md)                  | ![NPM Version (latest)](<https://img.shields.io/npm/v/%40fedimint%2Ffedimint-client-wasm-web?style=plastic&logo=npm&logoColor=rgb(187%2C%2054%2C%2057)&label=%40fedimint%2Fwasm-web&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40fedimint%2Ffedimint-client-wasm-web>)             | Not intended for direct use. Contains the wasm pack output (target web) for the Fedimint client wasm.     |
| [`@fedimint/wasm-bundler`](../packages/wasm-bundler/README.md)          | ![NPM Version (latest)](<https://img.shields.io/npm/v/%40fedimint%2Ffedimint-client-wasm-bundler?style=plastic&logo=npm&logoColor=rgb(187%2C%2054%2C%2057)&label=%40fedimint%2Fwasm-bundler&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40fedimint%2Ffedimint-client-wasm-bundler>) | Not intended for direct use. Contains the wasm pack output (target bundler) for the Fedimint client wasm. |
| [`create-fedimint-app`](../packages/create-fedimint-app/README.md)      | ![NPM Version (latest)](<https://img.shields.io/npm/v/create-fedimint-app?style=plastic&logo=npm&logoColor=rgb(187%2C%2054%2C%2057)&label=create-fedimint-app&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fcreate-fedimint-app>)                                                      | Scaffold a new Fedimint app with Vite, React, and TypeScript.                                             |

## Structure 🛠️

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
    ├── wasm-bundler
    └── create-fedimint-app
```

### Examples

- [`vite-core`](../examples/vite-core/README.md): Simple example of how to use the `core-web` package within a React app bundled with Vite.
- [`bare-js`](../examples/bare-js/README.md): Simple example of how to use the `core-web` package in a bare javascript environment (no bundler)

### Credit

Used the [wagmi](https://github.com/wevm/wagmi) library as a reference for the repo's structure.
