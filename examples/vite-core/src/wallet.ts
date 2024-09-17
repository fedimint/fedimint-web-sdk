import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

function init(onOpen: (boolean)) {
   kwallet.open().then(onOpen)
}

export { wallet }
