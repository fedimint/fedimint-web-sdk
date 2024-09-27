# Simple Vite Example

This is an example application demonstrating the usage of Fedimint client in a simple web application. [(demo)](https://fedimint.github.io/fedimint-web-sdk/)

## Deploy preview

You can preview this example live with [StackBlitz](https://stackblitz.com/github/fedimint/fedimint-web-sdk/tree/main/examples/vite-core)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/fedimint/fedimint-web-sdk/tree/main/examples/vite-core)

## Technologies Used

- core-web: The Fedimint client library for web applications
- Vite: A fast build tool and development server. Check the [`vite.config.ts`](./vite.config.ts) for configurations required for handling wasm.
- React

## Prerequisites

- Node.js
- pnpm (recommended) or npm

## Running the Application Locally

```bash
# from the root of the repo

# install dependencies
pnpm i

# run the dev server
pnpm run dev:vite
```
