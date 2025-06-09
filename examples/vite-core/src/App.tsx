import { useCallback, useEffect, useState } from 'react'
import { FedimintWallet, Wallet } from '@fedimint/core-web'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// Initialize global FedimintWallet
const fedimintWallet = FedimintWallet.getInstance()
// log.level('debug') // Set log level to debug for development
// @ts-ignore - Expose for testing
globalThis.fedimintWallet = fedimintWallet

const useWallets = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null)

  const createWallet = useCallback(async () => {
    const wallet = await fedimintWallet.createWallet()
    setWallets((prev) => [...prev, wallet])
    if (!activeWallet) {
      setActiveWallet(wallet)
    }
    return wallet
  }, [activeWallet])

  const selectWallet = useCallback((walletId: string) => {
    const wallet = fedimintWallet.getWallet(walletId)
    if (wallet) {
      setActiveWallet(wallet)
    }
  }, [])

  useEffect(() => {
    // Load existing wallets on mount
    const existingWallets = fedimintWallet.getAllWallets()
    setWallets(existingWallets)
    if (existingWallets.length > 0 && !activeWallet) {
      setActiveWallet(existingWallets[0])
    }
  }, [activeWallet])

  return { wallets, activeWallet, createWallet, selectWallet }
}

const useBalance = (wallet: Wallet | null) => {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    // Reset balance when wallet changes
    setBalance(0)

    if (!wallet || !wallet.isOpen()) {
      return
    }

    // Get current balance immediately
    const getCurrentBalance = async () => {
      try {
        const currentBalance = await wallet.balance.getBalance()
        setBalance(currentBalance)
      } catch (error) {
        console.error('Error fetching balance:', error)
      }
    }

    // Get initial balance
    getCurrentBalance()

    // Subscribe to balance changes
    const unsubscribe = wallet.balance.subscribeBalance((balance) => {
      setBalance(balance)
    })

    return () => {
      unsubscribe()
    }
  }, [wallet])

  return balance
}

const App = () => {
  const { wallets, activeWallet, createWallet, selectWallet } = useWallets()
  const balance = useBalance(activeWallet)

  return (
    <>
      <header>
        <h1>Multi-Wallet Fedimint Demo</h1>
      </header>
      <main>
        <WalletSelector
          wallets={wallets}
          activeWallet={activeWallet}
          onCreateWallet={createWallet}
          onSelectWallet={selectWallet}
        />
        {activeWallet && (
          <>
            <WalletStatus wallet={activeWallet} balance={balance} />
            <JoinFederation wallet={activeWallet} />
            <GenerateLightningInvoice wallet={activeWallet} />
            {/* Add more components as needed */}

            {/* Other components */}
          </>
        )}
      </main>
    </>
  )
}

const WalletStatus = ({
  wallet,
  balance,
}: {
  wallet: Wallet
  balance: number
}) => {
  return (
    <div className="section">
      <h3>Wallet Status</h3>
      <div>
        <strong>Wallet ID:</strong> {wallet.id.substring(0, 8)}...
      </div>
      <div>
        <strong>Balance:</strong> {balance} sats
      </div>
      <div>
        <strong>Federation ID:</strong>{' '}
        {wallet.federationId
          ? wallet.federationId.substring(0, 8) + '...'
          : 'Not joined'}
      </div>
    </div>
  )
}

const GenerateLightningInvoice = ({ wallet }: { wallet: Wallet }) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [invoice, setInvoice] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoice('')
    setError('')
    setGenerating(true)

    try {
      // Check if wallet is joined to federation
      if (!wallet.federationId) {
        throw new Error(
          'Wallet must be joined to a federation before creating invoices',
        )
      }

      // Ensure wallet is open
      if (!wallet.isOpen()) {
        throw new Error('Wallet is not open')
      }

      const response = await wallet.lightning.createInvoice(
        Number(amount),
        description,
      )
      setInvoice(response.invoice)
    } catch (e) {
      console.error('Error generating Lightning invoice', e)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  // Don't show form if wallet isn't joined to federation
  if (!wallet.federationId) {
    return (
      <div className="section">
        <h3>Generate Lightning Invoice</h3>
        <div className="error">
          Wallet must be joined to a federation before creating Lightning
          invoices.
        </div>
      </div>
    )
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
        <a href="https://faucet.mutinynet.com/" target="_blank">
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

const WalletSelector = ({
  wallets,
  activeWallet,
  onCreateWallet,
  onSelectWallet,
}: {
  wallets: Wallet[]
  activeWallet: Wallet | null
  onCreateWallet: () => Promise<Wallet>
  onSelectWallet: (walletId: string) => void
}) => {
  return (
    <div className="section">
      <h3>Wallet Management</h3>
      <div className="row">
        <button onClick={onCreateWallet}>Create New Wallet</button>
      </div>
      {wallets.length > 0 && (
        <div className="wallet-list">
          <strong>Wallets:</strong>
          {wallets.map((wallet) => (
            <div key={wallet.id} className="wallet-item">
              <button
                onClick={() => onSelectWallet(wallet.id)}
                className={activeWallet?.id === wallet.id ? 'active' : ''}
              >
                {wallet.id.substring(0, 8)}...
                {wallet.federationId
                  ? ` (Fed: ${wallet.federationId.substring(0, 8)}...)`
                  : ' (No Fed)'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const JoinFederation = ({ wallet }: { wallet: Wallet }) => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    setJoining(true)
    setJoinSuccess(false)
    e.preventDefault()

    try {
      const res = await wallet.joinFederation(inviteCode)
      console.log('join federation res', res)

      // Check if the result indicates success
      if (res && wallet.federationId) {
        setJoinSuccess(true)
        setError('')
      } else {
        throw new Error('Failed to join federation')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      setJoinSuccess(false)
    } finally {
      setJoining(false)
    }
  }

  // Show success state if either federationId exists or we just successfully joined
  if (wallet.federationId || joinSuccess) {
    return (
      <div className="section">
        <h3>Federation Status</h3>
        <div>Already joined federation: {wallet.federationId}</div>
      </div>
    )
  }

  return (
    <div className="section">
      <h3>Join Federation</h3>
      <form onSubmit={handleJoin}>
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Invite code..."
          required
        />
        <button type="submit" disabled={joining}>
          {joining ? 'Joining...' : 'Join Federation'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default App
