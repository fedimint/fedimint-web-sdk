import { FedimintWallet, WalletDirector } from '@fedimint/core-web'

let wallet: FedimintWallet | undefined

const walletDirector = new WalletDirector()

export const initFedimintReact = (lazy: boolean = false) => {
  if (!lazy) {
    walletDirector.createWallet().then((w) => {
      wallet = w
    })
  }

  return {}
}
