import { useEffect, useState } from 'react'
import { useFedimintWallet, useOpenWallet } from '.'

export const useBalance = () => {
  const wallet = useFedimintWallet()
  const { walletStatus } = useOpenWallet()
  const [balance, setBalance] = useState<number>()

  useEffect(() => {
    if (walletStatus !== 'open' || !wallet) return

    const unsubscribe = wallet.balance.subscribeBalance((balance: number) => {
      setBalance(balance)
    })

    return () => {
      unsubscribe()
    }
  }, [walletStatus, wallet])

  return balance
}
