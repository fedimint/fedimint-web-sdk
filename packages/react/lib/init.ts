import {
  Wallet,
  initialize,
  createWebWorkerTransport,
} from '@fedimint/core-web'

let wallet: Wallet | undefined

export const initFedimintReact = async (lazy: boolean = false) => {
  if (!lazy) {
    await initialize(createWebWorkerTransport)
  }

  return {}
}
