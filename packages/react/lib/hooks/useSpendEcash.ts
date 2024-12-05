import { useCallback, useEffect, useState } from 'react'
import { useFedimintWallet, useOpenWallet } from '.'

export const useSpendEcash = () => {
  const wallet = useFedimintWallet()
  const { walletStatus } = useOpenWallet()

  const [operationId, setOperationId] = useState<string>()
  const [notes, setNotes] = useState<string>()
  const [state, setState] = useState<any>()

  useEffect(() => {
    if (!operationId) return

    const unsubscribe = wallet.mint.subscribeSpendNotes(
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

  const spendEcash = useCallback(
    async (amountSats: number, reclaimAfter?: number) => {
      if (walletStatus !== 'open') throw new Error('Wallet is not open')
      const response = await wallet.mint.spendNotes(
        amountSats * 1000,
        reclaimAfter,
      )
      setOperationId(response.operation_id)
      setNotes(response.notes)
      return response.notes
    },
    [wallet],
  )

  return {
    spendEcash,
    notes,
    state,
  }
}
