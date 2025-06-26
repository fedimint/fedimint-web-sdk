import { useContext } from 'react'
import { FedimintWalletContext } from '../contexts'

export const useFedimintWallet = () => {
  const value = useContext(FedimintWalletContext)
  if (!value) {
    throw new Error(
      'useFedimintWallet must be used within a FedimintWalletProvider',
    )
  }
  return value.wallet
}
