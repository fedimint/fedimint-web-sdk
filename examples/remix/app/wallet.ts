import { FedimintWallet } from '@fedimint/core-web'

let wallet: FedimintWallet

if (typeof window !== 'undefined') {
  wallet = new FedimintWallet()
  wallet.setLogLevel('debug')
  wallet.open()
}

export { wallet }
