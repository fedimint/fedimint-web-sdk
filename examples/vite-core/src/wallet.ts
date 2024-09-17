import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

// try {
wallet.open()
// } catch (e) {
//   console.warn('Failed to open wallet', e)
// }

export { wallet }
