import { FedimintWallet } from '@fedimint/fedimint-web'

// TODO: Fix this
// Add init state inside of FedimintWallet
// Constructor should be sync
// then call open/join on the object
// throw errors if instance methods are called before
// the wallet is open

// const wallet = new FediintWallet()...
// wallet.open()

// export wallet

const wallet = new FedimintWallet()

await wallet
  .open()
  .then((res) => {
    console.warn('JOINED', JSON.stringify(res))
    return res
  })
  .catch((e) => {
    console.warn('JOIN FAILED', e)
  })

export { wallet }
