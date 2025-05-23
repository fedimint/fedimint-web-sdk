import { FedimintWallet } from '@fedimint/core-web'

let wallet: FedimintWallet

if (typeof window !== 'undefined') {
  wallet = new FedimintWallet()
  wallet.setLogLevel('debug')
  wallet.open()

  // Expose for testing
  // globalThis.wallet = wallet
}

export { wallet }
