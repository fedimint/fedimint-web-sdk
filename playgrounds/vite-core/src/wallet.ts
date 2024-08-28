import { FedimintWallet } from 'fedimint-web'

export const wallet = FedimintWallet

wallet.initFedimint().then(() => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log('Fedimint initialized')
})
