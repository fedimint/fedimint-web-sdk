import React from 'react'
import { useBalance, useReceiveLightning, useOpenWallet } from '../../lib'

const TEST_FEDERATION_INVITE =
  'fed11qgqzc2nhwden5te0vejkg6tdd9h8gepwvejkg6tdd9h8garhduhx6at5d9h8jmn9wshxxmmd9uqqzgxg6s3evnr6m9zdxr6hxkdkukexpcs3mn7mj3g5pc5dfh63l4tj6g9zk4er'

function HooksDemo() {
  const balance = useBalance()
  const { walletStatus, openWallet, joinFederation } = useOpenWallet()
  const isOpen = walletStatus === 'open'
  const { generateInvoice, bolt11, invoiceStatus, error } =
    useReceiveLightning()

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
              onClick={() => joinFederation(TEST_FEDERATION_INVITE)}
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
          <p className="truncate">{bolt11 ? bolt11 : 'no invoice generated'}</p>
        </div>
        <div className="row">
          <b>invoiceStatus:</b>
          <p>
            {typeof invoiceStatus === 'string'
              ? invoiceStatus
              : typeof invoiceStatus === 'object'
                ? Object.keys(invoiceStatus)[0]
                : 'no invoice status'}
          </p>
        </div>
        <div className="row">
          <b>error:</b>
          <p>{error}</p>
        </div>
      </div>
    </>
  )
}

export default HooksDemo