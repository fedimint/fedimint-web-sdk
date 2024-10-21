import { useContext } from 'react'
import { FedimintWalletContext } from '../contexts'

export const useFedimintWallet = () => {
  const wallet = useContext(FedimintWalletContext)
  if (!wallet) {
    throw new Error(
      'useFedimintWallet must be used within a FedimintWalletProvider',
    )
  }
  return wallet
}
