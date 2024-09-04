import { useEffect, useState } from 'react'
import { wallet } from './wallet'

const App = () => {
  useEffect(() => {
    return () => {
      wallet?.cleanup().catch(console.error)
    }
  }, [])

  return (
    <>
      <Header />
      <Main />
    </>
  )
}

const Header = () => {
  return (
    <header>
      <h1>Fedimint Typescript Library Demo</h1>
      <h3>This is a WIP</h3>
    </header>
  )
}

const Main = () => {
  return (
    <main>
      <Wallet />
      <RedeemEcash />
      <PayLightning />
    </main>
  )
}

const Wallet = () => {
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState(0)

  const refreshBalance = async () => {
    // TODO: Implement balance refresh logic
    console.log('Refreshing balance...', wallet)
    try {
      const bal = await wallet?.getBalance()
      console.warn('balance', bal)
      setBalance(bal || 0)
    } catch (e) {
      console.log('Error refreshing balance', e)
      setError(e?.message)
    }
  }

  return (
    <div className="section">
      <h3>Fedimint Wallet</h3>
      <div className="row">
        <strong>Balance:</strong>
        <div className="balance">{balance}</div>
        sats
        <button type="button" onClick={refreshBalance}>
          refresh
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  )
}

const RedeemEcash = () => {
  const [ecashInput, setEcashInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement ecash redeem logic
    console.log('Redeeming ecash:', ecashInput)
  }

  return (
    <div className="section">
      <h3>Redeem Ecash</h3>
      <form onSubmit={handleSubmit} className="row">
        <input
          className="ecash-input"
          placeholder="Long ecash string..."
          required
          value={ecashInput}
          onChange={(e) => setEcashInput(e.target.value)}
        />
        <button type="submit" className="ecash-submit">
          redeem
        </button>
      </form>
    </div>
  )
}

const PayLightning = () => {
  const [lightningInput, setLightningInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement lightning payment logic
    // console.log('Paying lightning invoice:', lightningInput)
  }

  return (
    <div className="section">
      <h3>Pay Lightning</h3>
      <form onSubmit={handleSubmit} className="row">
        <input
          className="lightning-input"
          placeholder="lnbc..."
          required
          value={lightningInput}
          onChange={(e) => setLightningInput(e.target.value)}
        />
        <button type="submit" className="lightning-submit">
          pay
        </button>
      </form>
    </div>
  )
}

export default App
