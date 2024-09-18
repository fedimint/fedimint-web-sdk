import { useCallback, useEffect, useState } from 'react'
import { wallet } from './wallet'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

const useIsOpen = () => {
  const [isOpen, setIsOpen] = useState(false)

  const checkIsOpen = useCallback(() => {
    if (isOpen !== wallet.isOpen()) setIsOpen(wallet.isOpen())
    return isOpen
  }, [wallet])

  return { isOpen, checkIsOpen }
}

const useBalance = () => {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const unsubscribe = wallet.subscribeBalance((balance: number) => {
      console.log('balance', balance)
      setBalance(balance)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return balance
}

const App = () => {
  const { isOpen, checkIsOpen } = useIsOpen()
  return (
    <>
      <header>
        <h1>Fedimint Typescript Library Demo</h1>
        <h2>This is a WIP</h2>
      </header>
      <main>
        <WalletStatus isOpen={isOpen} checkIsOpen={checkIsOpen} />
        <JoinFederation isOpen={isOpen} checkIsOpen={checkIsOpen} />
        <GenerateLightningInvoice />
        <RedeemEcash />
        <SendLightning />
      </main>
    </>
  )
}

const WalletStatus = ({
  isOpen,
  checkIsOpen,
}: {
  isOpen: boolean
  checkIsOpen: () => boolean
}) => {
  const balance = useBalance()

  return (
    <div className="section">
      <h3>Wallet Status</h3>
      <div className="row">
        <strong>Is Wallet Open?</strong>
        <div>{isOpen ? 'Yes' : 'No'}</div>
        <button onClick={() => checkIsOpen()}>Check</button>
      </div>
      <div className="row">
        <strong>Balance:</strong>
        <div className="balance">{balance}</div>
        sats
      </div>
    </div>
  )
}

const JoinFederation = ({
  isOpen,
  checkIsOpen,
}: {
  isOpen: boolean
  checkIsOpen: () => boolean
}) => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [joinResult, setJoinResult] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')

  const joinFederation = async (e: React.FormEvent) => {
    e.preventDefault()
    const open = checkIsOpen()
    console.log('OPEN', open, wallet)
    if (open) return

    console.log('Joining federation:', inviteCode)
    try {
      const res = await wallet?.joinFederation(inviteCode)
      console.log('join federation res', res)
      setJoinResult('Joined!')
      setJoinError('')
    } catch (e: any) {
      console.log('Error joining federation', e)
      setJoinError(typeof e === 'object' ? e.toString() : (e as string))
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
          disabled={isOpen}
        />
        <button type="submit" disabled={isOpen}>
          Join
        </button>
      </form>
      {!joinResult && isOpen && <i>(You've already joined a federation)</i>}
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
      console.log('redeem ecash res', res)
      setRedeemResult('Redeemed!')
      setRedeemError('')
    } catch (e) {
      console.log('Error redeeming ecash', e)
      setRedeemError(e as string)
      setRedeemResult('')
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
      await wallet.payBolt11Invoice(lightningInput)
      setLightningResult('Paid!')
      setLightningError('')
    } catch (e) {
      console.log('Error paying lightning', e)
      setLightningError(e as string)
      setLightningResult('')
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

const GenerateLightningInvoice = () => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [invoice, setInvoice] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoice('')
    setError('')

    try {
      const response = await wallet.createBolt11Invoice(
        Number(amount),
        description,
      )
      setInvoice(response.invoice)
    } catch (e) {
      console.error('Error generating Lightning invoice', e)
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="section">
      <h3>Generate Lightning Invoice</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="amount">Amount (sats):</label>
          <input
            id="amount"
            type="number"
            placeholder="Enter amount"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="description">Description:</label>
          <input
            id="description"
            placeholder="Enter description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit">Generate Invoice</button>
      </form>
      {invoice && (
        <div className="success">
          <strong>Generated Invoice:</strong>
          <pre className="invoice-wrap">{invoice}</pre>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default App
