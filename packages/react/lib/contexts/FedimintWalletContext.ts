import {
  Wallet,
  initialize,
  setLogLevel,
  type WalletInfo,
} from '@fedimint/core-web'
import {
  createContext,
  createElement,
  useEffect,
  useMemo,
  useState,
} from 'react'

let currentWallet: Wallet | null = null
let isInitialized = false

type FedimintWalletConfig = {
  lazy?: boolean
  debug?: boolean
}

export type WalletStatus = 'open' | 'closed' | 'opening' | 'uninitialized'

export const setupFedimintWallet = async (
  config: FedimintWalletConfig = {},
) => {
  if (!isInitialized) {
    await initialize()
    isInitialized = true
  }

  if (config.debug) {
    setLogLevel('debug')
  }
}

export const FedimintWalletContext = createContext<
  | {
      wallet: Wallet | null
      walletStatus: WalletStatus
      setWalletStatus: (status: WalletStatus) => void
      setWallet: (wallet: Wallet | null) => void
    }
  | undefined
>(undefined)

export type FedimintWalletProviderProps = {}

export const FedimintWalletProvider = (
  parameters: React.PropsWithChildren<FedimintWalletProviderProps>,
) => {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>(() =>
    isInitialized ? 'closed' : 'uninitialized',
  )
  const [wallet, setWallet] = useState<Wallet | null>(currentWallet)
  const { children } = parameters

  const contextValue = useMemo(
    () => ({
      wallet,
      walletStatus,
      setWalletStatus,
      setWallet: (newWallet: Wallet | null) => {
        currentWallet = newWallet
        setWallet(newWallet)
      },
    }),
    [wallet, walletStatus],
  )

  useEffect(() => {
    if (!isInitialized) {
      setWalletStatus('uninitialized')
      return
    }

    if (wallet && wallet.isOpen()) {
      setWalletStatus('open')
    }
  }, [wallet])

  return createElement(
    FedimintWalletContext.Provider,
    { value: contextValue },
    children,
  )
}
