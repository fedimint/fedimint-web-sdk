import { FedimintWallet } from '@fedimint/fedimint-web'

const inviteCode =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

await FedimintWallet.initWasm().catch((err) => {
  console.warn('INIT FAILED', err)
})
export const wallet = await FedimintWallet.open('CLIENT_NAME1')
  .then((res) => {
    console.warn('JOINED', res)
    return res
  })
  .catch((e) => {
    console.warn('JOIN FAILED', e)
  })
