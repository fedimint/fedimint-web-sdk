import { useCallback, useEffect, useState } from 'react'
import { useFedimintWallet, useOpenWallet } from '.'
import {
  type LnPayState,
  type OutgoingLightningPayment,
} from '@fedimint/core-web'

export const useSendLightning = () => {
  const wallet = useFedimintWallet()
  const { walletStatus } = useOpenWallet()
  const [payment, setPayment] = useState<OutgoingLightningPayment>()
  const [paymentState, setPaymentState] = useState<LnPayState>()
  const [error, setError] = useState<string>()

  const payInvoice = useCallback(
    async (bolt11: string) => {
      if (walletStatus !== 'open' || !wallet)
        throw new Error('Wallet is not open')
      const response = await wallet.lightning.payInvoice(bolt11)
      setPayment(response)
      return response
    },
    [wallet, walletStatus],
  )

  useEffect(() => {
    if (walletStatus !== 'open' || !payment || !wallet) return
    const unsubscribe = wallet.lightning.subscribeLnPay(
      // @ts-ignore
      payment.payment_type.lightning,
      (state: LnPayState) => {
        setPaymentState(state)
      },
      (error: string) => {
        setError(error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [walletStatus, payment, wallet])

  return {
    payInvoice,
    payment,
    paymentStatus: paymentState,
    paymentError: error,
  }
}
