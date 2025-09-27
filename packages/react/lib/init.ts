import { FedimintWallet, WalletDirector } from '@fedimint/core-web'
import { WasmWorkerTransport } from '@fedimint/transport-web'

let wallet: FedimintWallet | undefined

const walletDirector = new WalletDirector(new WasmWorkerTransport())

export const initFedimintReact = (lazy: boolean = false) => {
  if (!lazy) {
    walletDirector.createWallet().then((w) => {
      wallet = w
    })
  }

  return {}
}
