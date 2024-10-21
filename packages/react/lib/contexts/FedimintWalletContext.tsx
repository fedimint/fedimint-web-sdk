import { FedimintWallet } from '@fedimint/core-web'
import { createContext, createElement, useState } from 'react'

const wallet = new FedimintWallet()

export const FedimintWalletContext = createContext<
  { fedimintWallet: FedimintWallet } | undefined
>(undefined)

export type FedimintWalletProviderProps = {
  lazy: boolean | undefined
}

export const FedimintWalletProvider = (
  parameters: React.PropsWithChildren<FedimintWalletProviderProps>,
) => {
  const { lazy, children } = parameters

  const props = { value: lazy }

  const [wallet, setWallet] = useState<FedimintWallet | undefined>(undefined)

  return createElement(FedimintWalletContext.Provider, props, children)
}
