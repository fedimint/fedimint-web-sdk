import { useEffect, useState } from 'react'
import { wallet } from './wallet'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

const useBalance = () => {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const unsubscribe = wallet.subscribeBalance((balance: number) => {
      setBalance(balance)
    })

    return unsubscribe
  }, [])

  return balance
}

const App = () => {
  useEffect(() => {
    return () => {
      // wallet?.cleanup().catch(console.error)
    }
  }, [])

  return (
    <>
      <header>
        <h1>Fedimint Typescript Library Demo</h1>
        <h2>This is a WIP</h2>
      </header>
      <main>
        <WalletStatus />
        <JoinFederation />
        <RedeemEcash />
        <SendLightning />
      </main>
    </>
  )
}

const WalletStatus = () => {
  const balance = useBalance()

  return (
    <div className="section">
      <h3>Wallet Status</h3>
      <div className="row">
        <strong>Is Wallet Open?</strong>
        <div>{wallet.isOpen() ? 'Yes' : 'No'}</div>
      </div>
      <div className="row">
        <strong>Balance:</strong>
        <div className="balance">{balance}</div>
        sats
      </div>
    </div>
  )
}

const JoinFederation = () => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [joinResult, setJoinResult] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')

  const joinFederation = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Joining federation:', inviteCode)
    try {
      const res = await wallet?.joinFederation(inviteCode)
      console.warn('join federation res', res)
      setJoinResult('Joined!')
      setJoinError('')
    } catch (e) {
      console.log('Error joining federation', e)
      setJoinError(e as string)
      setJoinResult('')
    }
  }

  return (
    <div className="section">
      <h3>Join Federation</h3>
      <form onSubmit={joinFederation} className="row">
        <input
          className="ecash-input"
          placeholder="Invite Code..."
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          disabled={wallet.isOpen()}
        />
        <button type="submit" disabled={wallet.isOpen()}>
          Join
        </button>
      </form>
      {!joinResult && wallet.isOpen() && (
        <i>(You've already joined a federation)</i>
      )}
      {joinResult && <div className="success">{joinResult}</div>}
      {joinError && <div className="error">{joinError}</div>}
    </div>
  )
}

const RedeemEcash = () => {
  const [ecashInput, setEcashInput] = useState('')
  const [redeemResult, setRedeemResult] = useState('')
  const [redeemError, setRedeemError] = useState('')

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await wallet.redeemEcash(ecashInput)
      console.warn('redeem ecash res', res)
      setRedeemResult('Redeemed!')
    } catch (e) {
      console.log('Error redeeming ecash', e)
      setRedeemError(e as string)
    }
  }

  return (
    <div className="section">
      <h3>Redeem Ecash</h3>
      <form onSubmit={handleRedeem} className="row">
        <input
          placeholder="Long ecash string..."
          required
          value={ecashInput}
          onChange={(e) => setEcashInput(e.target.value)}
        />
        <button type="submit">redeem</button>
      </form>
      {redeemResult && <div className="success">{redeemResult}</div>}
      {redeemError && <div className="error">{redeemError}</div>}
    </div>
  )
}

const SendLightning = () => {
  const [lightningInput, setLightningInput] = useState('')
  const [lightningResult, setLightningResult] = useState('')
  const [lightningError, setLightningError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await wallet.payInvoice(lightningInput)
      setLightningResult('Paid!')
    } catch (e) {
      console.log('Error paying lightning', e)
      setLightningError(e as string)
    }
  }

  return (
    <div className="section">
      <h3>Pay Lightning</h3>
      <form onSubmit={handleSubmit} className="row">
        <input
          placeholder="lnbc..."
          required
          value={lightningInput}
          onChange={(e) => setLightningInput(e.target.value)}
        />
        <button type="submit">pay</button>
      </form>
      {lightningResult && <div className="success">{lightningResult}</div>}
      {lightningError && <div className="error">{lightningError}</div>}
    </div>
  )
}

export default App
