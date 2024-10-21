import { useCallback, useEffect, useState } from 'react'
import { useFedimintWallet, useOpenWallet } from '.'
import { LnReceiveState, type CreateBolt11Response } from '@fedimint/core-web'

export const useLightningInvoice = () => {
  const { wallet } = useFedimintWallet()
  const isOpen = useOpenWallet()
  const [invoice, setInvoice] = useState<CreateBolt11Response>()
  const [isPaid, setIsPaid] = useState<boolean>()
  const [invoiceStatus, setInvoiceStatus] = useState<LnReceiveState>()
  const [error, setError] = useState<string>()

  const generateInvoice = useCallback(
    async (amount: number, description: string) => {
      if (!isOpen) throw new Error('Wallet is not open')
      const response = await wallet.lightning.createInvoice(amount, description)
      setInvoice(response)
      return response.invoice
    },
    [wallet, isOpen],
  )

  useEffect(() => {
    if (!isOpen || !invoice) return
    const unsubscribe = wallet.lightning.subscribeLnReceive(
      invoice.operation_id,
      (state) => {
        setInvoiceStatus(state)
      },
      (error) => {
        setError(error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [isOpen, invoice])

  return {
    generateInvoice,
    bolt11: invoice?.invoice,
    invoiceStatus,
    isPaid,
    error,
  }
}
