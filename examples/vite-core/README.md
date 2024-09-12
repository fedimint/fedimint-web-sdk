# Simple Vite Example

This is an example application demonstrating the usage of Fedimint client in a simple web application. [(demo)](https://fedimint.github.io/fedimint-web-sdk/)

## Technologies Used

- core-web: The Fedimint client library for web applications
- Vite: A fast build tool and development server. Check the [`vite.config.ts`](./vite.config.ts) for configurations required for handling wasm.
- React

## Prerequisites

- Node.js
- pnpm (recommended) or npm

## Running the Application Locally

1. Clone the repository and navigate to the example directory:

   ```
   git clone https://github.com/fedimint/fedimint-web-sdk.git
   cd fedimint-web-sdk/examples/vite-core
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Start the development server:

   ```
   pnpm dev
   ```

4. Open your browser and visit `http://localhost:5173` to view the application.
