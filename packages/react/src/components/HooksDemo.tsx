import React from 'react'
import { useBalance, useLightningInvoice, useOpenWallet } from '../../lib'

function HooksDemo() {
  const balance = useBalance()
  const { isOpen, openWallet, isOpening } = useOpenWallet()
  const { generateInvoice, bolt11, invoiceStatus, isPaid, error } =
    useLightningInvoice()

  return (
    <>
      <div className="card">
        <h2>Hooks</h2>
        <div className="section">
          <b>useOpenWallet()</b>
          <div className="row">
            <b>openWallet()</b>
            <button disabled={isOpen} onClick={openWallet}>
              Open Wallet
            </button>
          </div>
          <div className="row">
            <b>isOpening:</b>
            <p>{isOpening ? 'true' : 'false'}</p>
          </div>
          <div className="row">
            <b>isOpen:</b>
            <p>{isOpen ? 'true' : 'false'}</p>
          </div>
        </div>
        <div className="section">
          <div className="row">
            <b>useBalance:</b>
            <p>{balance}</p>
          </div>
        </div>
        <div className="section">
          <b>useLightningInvoice()</b>
          <div className="row">
            <b>generateInvoice(amount, description)</b>
            <button
              onClick={() =>
                generateInvoice(1000, 'invoice from fedimint web sdk')
              }
            >
              Generate Invoice
            </button>
          </div>
        </div>
        <div className="row">
          <b>bolt11:</b>
          <p>{bolt11 ?? 'no invoice generated'}</p>
        </div>
        <div className="row"></div>
      </div>
    </>
  )
}

export default HooksDemo
