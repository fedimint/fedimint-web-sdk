import { FedimintWallet } from 'fedimint-web'

const inviteCode =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

await FedimintWallet.initWasm()
export const wallet = await FedimintWallet.joinFederation(
  'CLIENT_NAME1',
  inviteCode,
).then((res) => {
  console.warn('JOINED', res)
  return res
})
