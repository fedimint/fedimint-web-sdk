import { useEffect, useState } from 'react'
import { useFedimintWallet, useOpenWallet } from '.'

export const useBalance = () => {
  const { wallet } = useFedimintWallet()
  const isOpen = useOpenWallet()
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    if (!isOpen) return

    const unsubscribe = wallet.balance.subscribeBalance((balance) => {
      setBalance(balance)
    })

    return () => {
      unsubscribe()
    }
  }, [isOpen])

  return balance
}
