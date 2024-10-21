import React, { useEffect } from 'react'
import {
  useBalance,
  useLightningInvoice,
  useOpenWallet,
  useFedimintWallet,
} from '../../lib'

function HooksDemo() {
  const balance = useBalance()
  const { walletStatus, openWallet, joinFederation } = useOpenWallet()
  const wallet = useFedimintWallet()
  useEffect(() => {
    wallet.setLogLevel('debug')
  }, [])
  const isOpen = walletStatus === 'open'
  const { generateInvoice, bolt11, invoiceStatus, isPaid, error } =
    useLightningInvoice()

  return (
    <>
      <div className="card">
        <h2>Hooks</h2>
        <div className="section">
          <b>useOpenWallet()</b>
          <div className="row">
            <b>walletStatus:</b>
            <p>{walletStatus}</p>
          </div>
          <div className="row">
            <b>openWallet()</b>
            <button disabled={isOpen} onClick={openWallet}>
              Open Wallet
            </button>
          </div>
          <div className="row">
            <b>joinFederation(invite)</b>
            <button
              disabled={isOpen}
              onClick={() =>
                joinFederation(
                  'fed11qgqzc2nhwden5te0vejkg6tdd9h8gepwvejkg6tdd9h8garhduhx6at5d9h8jmn9wshxxmmd9uqqzgxg6s3evnr6m9zdxr6hxkdkukexpcs3mn7mj3g5pc5dfh63l4tj6g9zk4er',
                )
              }
            >
              Join Federation
            </button>
          </div>
        </div>
        <div className="section">
          <div className="row">
            <b>useBalance:</b>
            <p>{balance ? `${balance / 1000} sats` : 'no balance'}</p>
          </div>
        </div>
        <div className="section">
          <b>useLightningInvoice()</b>
          <div className="row">
            <b>generateInvoice(1000, '1000 msats')</b>
            <button
              disabled={!isOpen}
              onClick={() =>
                generateInvoice(1_000, 'invoice from fedimint web sdk')
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
