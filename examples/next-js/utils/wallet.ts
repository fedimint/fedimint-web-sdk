import { type FedimintWallet, WalletDirector } from '@fedimint/core'
import { WasmWorkerTransport } from '@fedimint/transport-web'

let director: WalletDirector | undefined
let wallet: FedimintWallet | undefined

if (typeof window !== 'undefined') {
  director = new WalletDirector(new WasmWorkerTransport())
  director.createWallet().then((_wallet) => {
    console.log('Creating wallet...')
    _wallet.open()
    wallet = _wallet

    // Expose the wallet to the global window object for testing
    // @ts-ignore
    globalThis.wallet = wallet
    // @ts-ignore
    globalThis.director = director
  })

  director.setLogLevel('debug')
}

export { wallet, director }
