import { FedimintWallet } from '../../../packages/fedimint-client-ts/src'

const inviteCode =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'
export const wallet = await FedimintWallet.open('CLIENT_NAME1').then((res) => {
  console.warn('JOINED', res)
  return res
})

// wallet.initFedimint().then(() => {
//   // biome-ignore lint/suspicious/noConsoleLog: <explanation>
//   console.log('Fedimint initialized')
// })
