import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

// @ts-ignore
globalThis.wallet = wallet

wallet.setLogLevel('debug')

wallet.open()

export { wallet }
