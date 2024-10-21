import { FedimintWallet } from '@fedimint/core-web'
import { useEffect, useState } from 'react'

export const useBalance = (wallet: FedimintWallet) => {
  const [balance, setBalance] = useState<number>()

  useEffect(() => {
    console.warn('isopen', wallet.isOpen(), 'asdfasdf')
    if (!wallet.isOpen()) return
    const unsubscribe = wallet.balance.subscribeBalance((balance) => {
      // checks if the wallet is open when the first
      // subscription event fires.
      // TODO: make a subscription to the wallet open status
      // checkIsOpen()
      setBalance(balance)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return balance
}
