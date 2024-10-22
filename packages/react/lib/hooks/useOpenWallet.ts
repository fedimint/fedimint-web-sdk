import { useCallback, useEffect, useState } from 'react'
import { useFedimintWallet } from '.'

type WalletStatus = 'open' | 'closed' | 'opening'

export const useOpenWallet = () => {
  const wallet = useFedimintWallet()
  const [walletStatus, setWalletStatus] = useState<WalletStatus>()

  const openWallet = useCallback(() => {
    if (walletStatus === 'open') return

    setWalletStatus('opening')
    wallet.open().then((res) => {
      setWalletStatus(res ? 'open' : 'closed')
    })
  }, [wallet])

  const joinFederation = useCallback(
    async (invite: string) => {
      if (walletStatus === 'open') return

      setWalletStatus('opening')

      const res = await wallet.joinFederation(invite)
      setWalletStatus(res ? 'open' : 'closed')
    },
    [wallet],
  )

  useEffect(() => {
    wallet.waitForOpen().then(() => {
      setWalletStatus('open')
    })

    return () => {
      setWalletStatus('closed')
    }
  }, [wallet])

  return { walletStatus, openWallet, joinFederation }
}
