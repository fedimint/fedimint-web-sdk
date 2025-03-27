import { useEffect, useState, useCallback } from 'react'
import { wallet } from '../wallet'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// Expose the wallet to the global window object for testing
// @ts-ignore
globalThis.wallet = wallet

const useIsOpen = () => {
  const [open, setIsOpen] = useState<boolean>(false)

  const checkIsOpen = useCallback(() => {
    if (open !== wallet.isOpen()) {
      setIsOpen(wallet.isOpen())
    }
  }, [open])

  useEffect(() => {
    checkIsOpen()
  }, [checkIsOpen])

  return { open, checkIsOpen }
}

const useBalance = (checkIsOpen: () => void): number => {
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    const unsubscribe: () => void = wallet.balance.subscribeBalance(
      (balance: number) => {
        // checks if the wallet is open when the first
        // subscription event fires.
        // TODO: make a subscription to the wallet open status
        checkIsOpen()
        setBalance(balance)
      },
    )

    return () => unsubscribe()
  }, [checkIsOpen])

  return balance
}

export default function App() {
  const { open, checkIsOpen } = useIsOpen()
  const balance = useBalance(checkIsOpen)

  return (
    <>
      <header>
        <h1>Fedimint Typescript Library Demo</h1>

        <div className="steps">
          <strong>Steps to get started:</strong>
          <ol>
            <li>Join a Federation (persists across sessions)</li>
            <li>Generate an Invoice</li>
            <li>
              Pay the Invoice using the{' '}
              <a href="https://faucet.mutinynet.com/" target="_blank">
                mutinynet faucet
              </a>
            </li>
            <li>
              Investigate the Browser Tools
              <ul>
                <li>Browser Console for logs</li>
                <li>Network Tab (websocket) for guardian requests</li>
                <li>Application Tab for state</li>
              </ul>
            </li>
          </ol>
        </div>
      </header>
      <main>
        <WalletStatus open={open} checkIsOpen={checkIsOpen} balance={balance} />
        <JoinFederation open={open} checkIsOpen={checkIsOpen} />
        <GenerateLightningInvoice />
        <RedeemEcash />
        <SendLightning />
      </main>
    </>
  )
}

interface WalletStatusProps {
  open: boolean
  checkIsOpen: () => void
  balance: number
}

const WalletStatus = ({
  open,
  checkIsOpen,
  balance,
}: {
  open: boolean
  checkIsOpen: () => void
  balance: number
}) => {
  return (
    <div className="section">
      <h3>Wallet Status</h3>
      <div className="row">
        <strong>Is Wallet Open?</strong>
        <div>{open ? 'Yes' : 'No'}</div>
        <button onClick={checkIsOpen}>Check</button>
      </div>
      <div className="row">
        <strong>Balance:</strong>
        <div className="balance">{balance}</div> sats
      </div>
    </div>
  )
}

const JoinFederation = ({
  open,
  checkIsOpen,
}: {
  open: boolean
  checkIsOpen: () => void
}) => {
  const [inviteCode, setInviteCode] = useState<string>(TESTNET_FEDERATION_CODE)
  const [joinResult, setJoinResult] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState<boolean>(false)

  const joinFederation = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    checkIsOpen()

    try {
      setJoining(true)
      await wallet.joinFederation(inviteCode)
      setJoinResult('Joined!')
      setJoinError(null)
    } catch (error: any) {
      setJoinError(typeof error === 'object' ? error.toString() : String(error))
      setJoinResult(null)
    } finally {
      setJoining(false)
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
          disabled={open}
        />
        <button type="submit" disabled={open || joining}>
          Join
        </button>
      </form>
      {!joinResult && open && <i>(You've already joined a federation)</i>}
      {joinResult && <div className="success">{joinResult}</div>}
      {joinError && <div className="error">{joinError}</div>}
    </div>
  )
}

const RedeemEcash = () => {
  const [ecashInput, setEcashInput] = useState<string>('')
  const [redeemResult, setRedeemResult] = useState<string>('')
  const [redeemError, setRedeemError] = useState<string>('')

  const handleRedeem = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    try {
      await wallet.mint.redeemEcash(ecashInput)
      setRedeemResult('Redeemed!')
      setRedeemError('')
    } catch (error: any) {
      setRedeemError(error.toString())
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
        <button type="submit">Redeem</button>
      </form>
      {redeemResult && <div className="success">{redeemResult}</div>}
      {redeemError && <div className="error">{redeemError}</div>}
    </div>
  )
}

const SendLightning = () => {
  const [lightningInput, setLightningInput] = useState<string>('')
  const [lightningResult, setLightningResult] = useState<string>('')
  const [lightningError, setLightningError] = useState<string>('')

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    try {
      await wallet.lightning.payInvoice(lightningInput)
      setLightningResult('Paid!')
      setLightningError('')
    } catch (error: any) {
      setLightningError(error.toString())
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
        <button type="submit">Pay</button>
      </form>
      {lightningResult && <div className="success">{lightningResult}</div>}
      {lightningError && <div className="error">{lightningError}</div>}
    </div>
  )
}

const GenerateLightningInvoice = () => {
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [invoice, setInvoice] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [generating, setGenerating] = useState<boolean>(false)

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    setInvoice('')
    setError('')
    setGenerating(true)
    try {
      const response = await wallet.lightning.createInvoice(
        Number(amount),
        description,
      )
      setInvoice(response.invoice)
    } catch (error: any) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setGenerating(false)
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
        <button type="submit" disabled={generating}>
          {generating ? 'Generating...' : 'Generate Invoice'}
        </button>
      </form>
      <div>
        mutinynet faucet:{' '}
        <a
          href="https://faucet.mutinynet.com/"
          target="_blank"
          rel="noreferrer"
        >
          https://faucet.mutinynet.com/
        </a>
      </div>
      {invoice && (
        <div className="success">
          <strong>Generated Invoice:</strong>
          <pre className="invoice-wrap">{invoice}</pre>
          <button onClick={() => navigator.clipboard.writeText(invoice)}>
            Copy
          </button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  )
}
