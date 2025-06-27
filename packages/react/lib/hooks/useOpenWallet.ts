import { useCallback, useContext } from 'react'
import {
  openWallet as openWalletCore,
  joinFederation as joinFederationCore,
  getWallet,
  listClients,
} from '@fedimint/core-web'
import { FedimintWalletContext } from '../contexts/FedimintWalletContext'

export const useOpenWallet = () => {
  const value = useContext(FedimintWalletContext)

  if (!value) {
    throw new Error(
      'useOpenWallet must be used within a FedimintWalletProvider',
    )
  }

  const { wallet, walletStatus, setWalletStatus, setWallet } = value

  const openWallet = useCallback(
    async (walletId: string) => {
      if (walletStatus === 'open') return

      setWalletStatus('opening')
      try {
        const openedWallet = await openWalletCore(walletId)
        setWallet(openedWallet)
        setWalletStatus('open')
        return true
      } catch (error: any) {
        setWalletStatus('closed')
        return false
      }
    },
    [setWalletStatus, setWallet, walletStatus],
  )

  const joinFederation = useCallback(
    async (invite: string, walletId?: string) => {
      if (walletStatus === 'open') return

      setWalletStatus('opening')
      try {
        const newWallet = await joinFederationCore(invite, walletId)
        setWallet(newWallet)
        setWalletStatus('open')
        return true
      } catch (error: any) {
        setWalletStatus('closed')
        return false
      }
    },
    [setWalletStatus, setWallet, walletStatus],
  )

  const getWalletsList = useCallback(() => {
    return listClients()
  }, [])

  return { walletStatus, openWallet, joinFederation, getWalletsList }
}
