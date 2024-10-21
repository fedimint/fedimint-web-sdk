import { useCallback, useEffect, useState } from 'react'
import { useFedimintWallet } from '.'

export const useOpenWallet = () => {
  const { wallet } = useFedimintWallet()
  const [isOpen, setIsOpen] = useState<boolean>()
  const [isOpening, setIsOpening] = useState<boolean>()

  const openWallet = useCallback(() => {
    if (isOpen) return
    setIsOpening(true)
    wallet.open().then((res) => {
      setIsOpen(res)
      setIsOpening(false)
    })
  }, [wallet])

  useEffect(() => {
    wallet.waitForOpen().then(() => {
      setIsOpen(true)
    })

    return () => {
      setIsOpen(false)
    }
  }, [wallet])

  return { isOpen, openWallet, isOpening }
}
