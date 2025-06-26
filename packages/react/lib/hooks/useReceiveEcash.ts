import { useCallback, useEffect, useState } from 'react'
import { useFedimintWallet, useOpenWallet } from '.'
import { ReissueExternalNotesState } from '@fedimint/core-web'

export const useReceiveEcash = () => {
  const wallet = useFedimintWallet()
  const { walletStatus } = useOpenWallet()

  const [operationId, setOperationId] = useState<string>()
  const [state, setState] = useState<ReissueExternalNotesState | 'Error'>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!operationId || !wallet) return

    const unsubscribe = wallet.mint.subscribeReissueExternalNotes(
      operationId,
      (_state: ReissueExternalNotesState) => {
        setState(_state)
      },
      (error: string) => {
        setError(error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [operationId, wallet])

  const redeemEcash = useCallback(
    async (notes: string) => {
      if (walletStatus !== 'open' || !wallet)
        throw new Error('Wallet is not open')
      try {
        const response = await wallet.mint.redeemEcash(notes)
        setOperationId(response)
      } catch (e) {
        setState('Error')
        setError(e as string)
      }
    },
    [wallet, walletStatus],
  )

  return {
    redeemEcash,
    state,
    error,
  }
}
