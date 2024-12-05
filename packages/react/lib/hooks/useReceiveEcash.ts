import { useCallback, useEffect, useState } from 'react'
import { useFedimintWallet, useOpenWallet } from '.'

export const useReceiveEcash = () => {
  const wallet = useFedimintWallet()
  const { walletStatus } = useOpenWallet()

  const [operationId, setOperationId] = useState<string>()
  const [notes, setNotes] = useState<string>()
  const [state, setState] = useState<any>()

  useEffect(() => {
    if (!operationId) return

    const unsubscribe = wallet.mint.subscribeReissueExternalNotes(
      operationId,
      (_state) => (_state ? setState(_state) : setState(undefined)),
      (error) => {
        console.error('ECASH SPEND STATE ERROR', error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [operationId])

  const redeemEcash = useCallback(
    async (notes: string) => {
      if (walletStatus !== 'open') throw new Error('Wallet is not open')
      const response = await wallet.mint.redeemEcash(notes)
      console.error('REEDEEEM', response)
      // setOperationId(response.operation_id)
      // setNotes(response.notes)
      return response
    },
    [wallet],
  )

  return {
    redeemEcash,
    notes,
    state,
  }
}
