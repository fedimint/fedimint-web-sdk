import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

wallet.setLogLevel('debug')

wallet.open()

export { wallet }
