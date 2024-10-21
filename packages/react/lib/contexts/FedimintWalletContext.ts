import { FedimintWallet } from '@fedimint/core-web'
import { createContext, createElement } from 'react'

const wallet = new FedimintWallet()

export const FedimintWalletContext = createContext<
  { wallet: FedimintWallet } | undefined
>(undefined)

export type FedimintWalletProviderProps = {
  lazy: boolean | undefined
}

export const FedimintWalletProvider = (
  parameters: React.PropsWithChildren<FedimintWalletProviderProps>,
) => {
  const { lazy, children } = parameters

  const props = { value: { wallet } }

  return createElement(FedimintWalletContext.Provider, props, children)
}
