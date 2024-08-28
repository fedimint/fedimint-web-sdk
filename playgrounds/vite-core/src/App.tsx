import { useEffect, useState } from 'react'
import { wallet } from './wallet'

function App() {
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(wallet)
  }, [])

  return (
    <>
      <Header />
      <Main />
    </>
  )
}

function Header() {
  return (
    <header>
      <h1>Fedimint Typescript Library Demo</h1>
      <h3>This is a WIP</h3>
    </header>
  )
}

function Main() {
  return (
    <main>
      <Wallet />
      <RedeemEcash />
      <PayLightning />
    </main>
  )
}

function Wallet() {
  const [balance, setBalance] = useState(0)

  const refreshBalance = () => {
    // TODO: Implement balance refresh logic
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Refreshing balance...')
    setBalance(100)
  }

  return (
    <div className="section">
      <h3>Fedimint Wallet</h3>
      <div className="row">
        <strong>Balance:</strong>
        <div className="row">
          <div className="balance">{balance}</div>
          sats
          <button type="button" onClick={refreshBalance}>
            refresh
          </button>
        </div>
      </div>
    </div>
  )
}

function RedeemEcash() {
  const [ecashInput, setEcashInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement ecash redeem logic
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
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

function PayLightning() {
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
