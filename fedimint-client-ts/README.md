# Fedimint Client Typescript (Web)

### THIS IS A WORK IN PROGRESS AND NOT READY FOR USE

This package provides a typescript interface for the Fedimint client in the browser

## Installation

```sh
npm install fedimint-client-ts
# or
yarn add fedimint-client-ts
```

## Usage

```ts
import { FedimintWallet } from "fedimint-client-ts";

// federation invite code
const inviteCode =
  "fed11qgqpw9thwvaz7t...";

// This should be called only once
await FedimintWallet.initFedimint();

const wallet = await FedimintWallet.joinFederation(
  inviteCode
);

// Get Wallet Balance
const balance = await wallet.getBalance();

// Receive Ecash Payments
await wallet.reissueNotes("A11qgqpw9thwvaz7t...");

// Pay Lightning Invoice
await wallet.payInvoice("lnbc...");
```

## Run the Example

Check out the example in the [`example` folder](./example)
