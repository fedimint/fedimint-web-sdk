# Get Balance

### `lightning.payInvoiceSync(invoice: string)`

Helper function to pay an invoice and resolve when the payment is confirmed or fails.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const result = await wallet.lightning.payInvoiceSync(
  // [!code focus]
  'lnbc...', // bolt11 invoice // [!code focus]
) // [!code focus]

if (result.success) {
  console.log(result.data.preimage) // preimage of the settled payment
  console.log(result.data.feeMsats) // fee paid in msats
}
```

### `lightning.payInvoice(invoice: string)`

Attempt to pay a lightning invoice. Returns an `OutgoingLightningPayment` object containing details about the in-flight payment.

You can use `subscribeLnPay` to track the payment status and `waitForPay` to wait for the payment to be confirmed or fail.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'
import type { LnPayState } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const { contract_id, fee } = await wallet.lightning.payInvoice(
  // [!code focus]
  'lnbc...', // bolt11 invoice // [!code focus]
) // [!code focus]

console.log(contract_id) // in flight lightning payment id

const unsubscribe = wallet.lightning.subscribeLnPay(
  // [!code focus]
  contract_id, // [!code focus]
  (state: LnPayState) => console.log(state), // State of the payment // [!code focus]
  (error: string) => console.error(error), // [!code focus]
)

// ...Cleanup Later
unsubscribe()

const result = await wallet.lightning.waitForPay(contract_id) // [!code focus]

if (result.success) {
  console.log(result.data.preimage) // preimage of the settled payment
}
```
