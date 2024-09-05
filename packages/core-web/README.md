# @fedimint/core-web

### THIS IS A WORK IN PROGRESS AND NOT READY FOR USE

This package provides a typescript interface for the Fedimint client in the browser

## Installation

```sh
pnpm add @fedimint/core-web
```

## Usage

```ts
import { FedimintWallet } from '@fedimint/core-web'

// federation invite code
const inviteCode = 'fed11qgqpw9thwvaz7t...'

// This should be called only once
await FedimintWallet.initFedimint()

const wallet = await FedimintWallet.joinFederation(inviteCode)

// Get Wallet Balance
const balance = await wallet.getBalance()

// Receive Ecash Payments
await wallet.reissueNotes('A11qgqpw9thwvaz7t...')

// Pay Lightning Invoice
await wallet.payInvoice('lnbc...')
```

## Check out the example

[`examples/vite-core`](../examples/vite-core/README.md)
