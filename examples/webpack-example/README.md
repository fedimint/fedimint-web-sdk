# Fedimint Web SDK - Webpack Example

This example demonstrates how to use the Fedimint Web SDK in a Webpack-based project.

## Prerequisites

- Node.js (v16 or later)
- pnpm (recommended) or npm
- A running Fedimint server (default: ws://localhost:3333)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm start
```

This will start the webpack development server at http://localhost:3000.

## Building for Production

To create a production build:

```bash
pnpm build
```

The built files will be available in the `dist` directory.

## Project Structure

- `src/index.html` - The HTML template
- `src/index.ts` - Main TypeScript file with Fedimint Web SDK integration
- `webpack.config.js` - Webpack configuration
- `tsconfig.json` - TypeScript configuration

## Features

- Connect to a Fedimint server
- Check balance
- Modern UI with responsive design
- TypeScript support
- Hot Module Replacement during development

## Notes

- Make sure your Fedimint server is running before trying to connect
- The default connection URL is `ws://localhost:3333`. Update this in `src/index.ts` if your server is running on a different address
