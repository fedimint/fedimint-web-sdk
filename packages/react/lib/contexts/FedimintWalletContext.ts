import { FedimintWallet } from '@fedimint/core-web'
import { createContext, createElement } from 'react'

let wallet: FedimintWallet

type FedimintWalletConfig = {
  lazy?: boolean
  debug?: boolean
}

export const setupFedimintWallet = (config: FedimintWalletConfig) => {
  wallet = new FedimintWallet(!!config.lazy)
  if (config.debug) {
    wallet.setLogLevel('debug')
  }
}

export const FedimintWalletContext = createContext<
  { wallet: FedimintWallet } | undefined
>(undefined)

export type FedimintWalletProviderProps = {}

export const FedimintWalletProvider = (
  parameters: React.PropsWithChildren<FedimintWalletProviderProps>,
) => {
  const { children } = parameters

  if (!wallet)
    throw new Error(
      'You must call setupFedimintWallet() first. See the getting started guide.',
    )

  const props = { value: { wallet } }

  return createElement(FedimintWalletContext.Provider, props, children)
}
