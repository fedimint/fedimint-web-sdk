import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()

try {
  await wallet.open()
} catch (e) {
  console.warn('Failed to open wallet', e)
}

export { wallet }
