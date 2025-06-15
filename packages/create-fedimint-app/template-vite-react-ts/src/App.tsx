import { useCallback, useEffect, useState } from 'react'
import { FedimintWallet, Wallet } from '@fedimint/core-web'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// Initialize global FedimintWallet
const fedimintWallet = FedimintWallet.getInstance()
// @ts-ignore - Expose for testing
globalThis.fedimintWallet = fedimintWallet

// Custom hooks
const useIsOpen = (wallet: Wallet | undefined) => {
  const [open, setIsOpen] = useState(false)

  const checkIsOpen = useCallback(() => {
    if (wallet) {
      const isOpen = wallet.isOpen()
      if (open !== isOpen) {
        setIsOpen(isOpen)
      }
    }
  }, [open, wallet])

  useEffect(() => {
    checkIsOpen()
  }, [checkIsOpen, wallet])

  return { open, checkIsOpen }
}

const useBalance = (wallet: Wallet | undefined, checkIsOpen: () => void) => {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    setBalance(0)

    if (!wallet?.federationId) {
      return
    }

    // Fetch current balance immediately
    const fetchBalance = async () => {
      try {
        const currentBalance = await wallet.balance.getBalance()
        setBalance(currentBalance)
        checkIsOpen()
      } catch (error) {
        console.error('Error fetching balance:', error)
        setBalance(0)
      }
    }

    fetchBalance()

    // Subscribe to balance changes
    const unsubscribe = wallet.balance.subscribeBalance(
      (balance) => {
        checkIsOpen()
        setBalance(balance)
      },
      (error) => {
        console.error('Balance subscription error:', error)
        setBalance(0)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [wallet, wallet?.federationId, checkIsOpen])

  return balance
}

const App = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletPointers, setWalletPointers] = useState<
    Array<{
      id: string
      clientName: string
      federationId?: string
      createdAt: number
      lastAccessedAt: number
    }>
  >([])
  const [activeWallet, setActiveWallet] = useState<Wallet | undefined>(
    undefined,
  )
  const [walletId, setWalletId] = useState('')
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState('')
  const [federationJoined, setFederationJoined] = useState(false)

  const { open, checkIsOpen } = useIsOpen(activeWallet)
  const balance = useBalance(activeWallet, checkIsOpen)

  // Add effect to watch for federation changes
  useEffect(() => {
    if (activeWallet) {
      setFederationJoined(!!activeWallet.federationId)
    }
  }, [activeWallet, activeWallet?.federationId])

  // Load wallet pointers on mount and refresh periodically
  useEffect(() => {
    const loadWalletPointers = () => {
      const pointers = fedimintWallet.getAllWalletPointers()
      setWalletPointers(pointers)
    }

    loadWalletPointers()

    // Refresh wallet pointers periodically
    const interval = setInterval(loadWalletPointers, 5000)
    return () => clearInterval(interval)
  }, [])

  // Wallet management functions
  const createWallet = useCallback(async () => {
    const wallet = await fedimintWallet.createWallet()
    setError('')
    setWallets((prev) => [...prev, wallet])
    if (!activeWallet) {
      setActiveWallet(wallet)
    }
    // Refresh wallet pointers after creating
    setWalletPointers(fedimintWallet.getAllWalletPointers())
    return wallet
  }, [activeWallet])

  const openWallet = useCallback(
    async (walletId: string) => {
      try {
        const wallet = await fedimintWallet.openWallet(walletId)
        const existingWallet = wallets.find((w) => w.id === walletId)
        if (!existingWallet) {
          setWallets((prev) => [...prev, wallet])
        }
        setActiveWallet(wallet)
        setWalletId('')
        setError('')
        setFederationJoined(!!wallet.federationId)
        // Refresh wallet pointers after opening
        setWalletPointers(fedimintWallet.getAllWalletPointers())
        return wallet
      } catch (error) {
        console.error('Error opening wallet:', error)
        setError(error instanceof Error ? error.message : String(error))
        throw error
      }
    },
    [wallets],
  )

  const selectWallet = useCallback(async (walletId: string) => {
    try {
      setError('')

      // First try to get from memory
      let wallet = fedimintWallet.getWallet(walletId)

      if (!wallet) {
        // If not in memory, open it
        console.log(`Opening wallet ${walletId} from storage`)
        wallet = await fedimintWallet.openWallet(walletId)

        // Add to wallets array if not already there
        setWallets((prev) => {
          const existingWallet = prev.find((w) => w.id === walletId)
          if (!existingWallet) {
            console.log(`Adding wallet ${walletId} to wallets array`)
            return [...prev, wallet]
          }
          return prev
        })
      }

      // Update active wallet
      console.log(
        `Setting active wallet to ${wallet.id} with federation ${wallet.federationId}`,
      )
      setActiveWallet(wallet)
      setFederationJoined(!!wallet.federationId)

      // Refresh wallet pointers after selecting
      setWalletPointers(fedimintWallet.getAllWalletPointers())
    } catch (error) {
      console.error('Error selecting wallet:', error)
      setError(error instanceof Error ? error.message : String(error))
    }
  }, [])

  const handleOpenWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    setOpening(true)
    setError('')

    try {
      await openWallet(walletId)
    } catch (error) {
      console.error('Error opening wallet:', error)
    } finally {
      setOpening(false)
    }
  }

  useEffect(() => {
    const existingWallets = fedimintWallet.getAllWallets()
    setWallets(existingWallets)
    if (existingWallets.length > 0 && !activeWallet) {
      setActiveWallet(existingWallets[0])
    }
  }, [activeWallet])

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
        <WalletManagement
          wallets={wallets}
          walletPointers={walletPointers}
          activeWallet={activeWallet}
          walletId={walletId}
          opening={opening}
          onCreateWallet={createWallet}
          onSelectWallet={selectWallet}
          onOpenWallet={handleOpenWallet}
          onWalletIdChange={setWalletId}
        />

        {activeWallet && (
          <>
            <WalletStatus
              wallet={activeWallet}
              open={open}
              checkIsOpen={checkIsOpen}
              balance={balance}
            />
            <JoinFederation
              wallet={activeWallet}
              open={open}
              checkIsOpen={checkIsOpen}
              onFederationJoined={() => setFederationJoined(true)}
            />

            {/* Only show these components if wallet has joined a federation */}
            {federationJoined && (
              <>
                <GenerateLightningInvoice wallet={activeWallet} />
                <RedeemEcash wallet={activeWallet} />
                <SendLightning wallet={activeWallet} />
              </>
            )}
          </>
        )}

        <ParseInviteCode />
        <ParseBolt11Invoice />

        {error && <div className="error">{error}</div>}
      </main>
    </>
  )
}

const WalletManagement = ({
  wallets,
  walletPointers,
  activeWallet,
  walletId,
  opening,
  onCreateWallet,
  onSelectWallet,
  onOpenWallet,
  onWalletIdChange,
}: {
  wallets: Wallet[]
  walletPointers: Array<{
    id: string
    clientName: string
    federationId?: string
    createdAt: number
    lastAccessedAt: number
  }>
  activeWallet: Wallet | undefined
  walletId: string
  opening: boolean
  onCreateWallet: () => void
  onSelectWallet: (walletId: string) => void
  onOpenWallet: (e: React.FormEvent) => void
  onWalletIdChange: (id: string) => void
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatWalletId = (id: string) => {
    return id.length > 8 ? `${id.slice(0, 8)}...` : id
  }

  const isWalletLoaded = (walletId: string) => {
    return wallets.some((w) => w.id === walletId)
  }

  return (
    <div className="section">
      <h3>Wallet Management</h3>
      <div className="row">
        <button onClick={onCreateWallet}>Create New Wallet</button>
      </div>

      {/* Open Wallet Form */}
      <div className="section">
        <h3>Open Existing Wallet</h3>
        <form onSubmit={onOpenWallet}>
          <div className="input-group">
            <label htmlFor="walletId">Wallet ID:</label>
            <input
              id="walletId"
              type="text"
              placeholder="Enter wallet ID"
              required
              value={walletId}
              onChange={(e) => onWalletIdChange(e.target.value)}
            />
          </div>
          <button type="submit" disabled={opening || !walletId.trim()}>
            {opening ? 'Opening...' : 'Open Wallet'}
          </button>
        </form>
      </div>

      {/* Wallet Pointers List */}
      {walletPointers.length > 0 && (
        <div className="wallet-list">
          <h4>Available Wallets ({walletPointers.length}):</h4>
          <div className="wallet-grid">
            {walletPointers.map((pointer) => (
              <div
                key={pointer.id}
                className={`wallet-item ${activeWallet?.id === pointer.id ? 'active' : ''}`}
              >
                <button
                  onClick={() => onSelectWallet(pointer.id)}
                  className="wallet-button"
                  title={`Wallet ID: ${pointer.id}\nClient: ${pointer.clientName}\nCreated: ${formatDate(pointer.createdAt)}\nLast accessed: ${formatDate(pointer.lastAccessedAt)}`}
                >
                  <div className="wallet-info">
                    <div className="wallet-id">
                      <strong>{formatWalletId(pointer.id)}</strong>
                      {isWalletLoaded(pointer.id) && (
                        <span className="loaded-indicator">●</span>
                      )}
                    </div>
                    <div className="wallet-federation">
                      {pointer.federationId
                        ? `Fed: ${pointer.federationId.slice(0, 8)}...`
                        : 'No Federation'}
                    </div>
                    <div className="wallet-dates">
                      <small>Last: {formatDate(pointer.lastAccessedAt)}</small>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currently Loaded Wallets (for debugging) */}
      {wallets.length > 0 && (
        <details className="loaded-wallets">
          <summary>Loaded in Memory ({wallets.length})</summary>
          <div className="wallet-list">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="wallet-item">
                <span>{formatWalletId(wallet.id)}</span>
                <span>{wallet.federationId ? 'Joined' : 'No Fed'}</span>
                <span>{wallet.isOpen() ? 'Open' : 'Closed'}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

const WalletStatus = ({
  wallet,
  open,
  checkIsOpen,
  balance,
}: {
  wallet: Wallet
  open: boolean
  checkIsOpen: () => void
  balance: number
}) => {
  return (
    <div className="section">
      <h3>Wallet Status</h3>
      <div className="row">
        <strong>Wallet ID:</strong>
        <div>{wallet.id}</div>
      </div>
      <div className="row">
        <strong>Balance:</strong>
        <div className="balance">{balance}</div>
        Msats
      </div>
      <div className="row">
        <strong>Federation ID:</strong>
        <div>{wallet.federationId ? wallet.federationId : 'Not joined'}</div>
      </div>
    </div>
  )
}

const JoinFederation = ({
  wallet,
  open,
  checkIsOpen,
  onFederationJoined,
}: {
  wallet: Wallet
  open: boolean
  checkIsOpen: () => void
  onFederationJoined?: () => void // Add optional callback
}) => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewing, setPreviewing] = useState(false)
  const [joinResult, setJoinResult] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  const previewFederation = async () => {
    if (!inviteCode.trim()) return

    setPreviewing(true)
    setJoinError('')

    try {
      const data = await fedimintWallet.previewFederation(inviteCode)
      setPreviewData(data)
      console.log('Preview federation:', data)
    } catch (error) {
      console.error('Error previewing federation:', error)
      setJoinError(error instanceof Error ? error.message : String(error))
      setPreviewData(null)
    } finally {
      setPreviewing(false)
    }
  }

  const joinFederation = async (e: React.FormEvent) => {
    e.preventDefault()
    checkIsOpen()

    console.log('Joining federation:', inviteCode)
    try {
      setJoining(true)
      const res = await wallet.joinFederation(inviteCode)
      console.log('join federation res', res)
      setJoinResult('Joined!')
      setJoinError('')
      // Call the callback to notify parent component
      onFederationJoined?.()
    } catch (e: any) {
      console.log('Error joining federation', e)
      setJoinError(typeof e === 'object' ? e.toString() : (e as string))
      setJoinResult('')
    } finally {
      setJoining(false)
    }
  }

  if (wallet.federationId) {
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
      <form onSubmit={joinFederation}>
        <input
          placeholder="Invite Code..."
          required
          value={inviteCode}
          onChange={(e) => {
            setInviteCode(e.target.value)
            setPreviewData(null)
          }}
        />
        <div className="button-group">
          <button
            type="button"
            onClick={previewFederation}
            disabled={previewing || !inviteCode.trim()}
          >
            {previewing ? 'Previewing...' : 'Preview Federation'}
          </button>
          <button type="submit" disabled={joining}>
            {joining ? 'Joining...' : 'Join Federation'}
          </button>
        </div>
      </form>

      {previewData && (
        <div className="preview-result">
          <h4>Federation Preview:</h4>
          <div className="preview-info">
            <div>
              <strong>Federation ID:</strong> {previewData.federation_id}
            </div>
            <div>
              <strong>Config:</strong> {previewData.url}
            </div>
            <details>
              <summary>Full Details</summary>
              <pre>{JSON.stringify(previewData, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}

      {joinResult && <div className="success">{joinResult}</div>}
      {joinError && <div className="error">{joinError}</div>}
    </div>
  )
}

const GenerateLightningInvoice = ({ wallet }: { wallet: Wallet }) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [invoice, setInvoice] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  // Debug: Log wallet changes
  useEffect(() => {
    console.log('GenerateLightningInvoice received wallet:', {
      id: wallet.id,
      federationId: wallet.federationId,
      isOpen: wallet.isOpen(),
    })
  }, [wallet.id, wallet.federationId])

  // Reset component state when wallet changes
  useEffect(() => {
    setAmount('')
    setDescription('')
    setInvoice('')
    setError('')
    setGenerating(false)
  }, [wallet.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoice('')
    setError('')
    setGenerating(true)

    console.log('Generating invoice for wallet:', {
      id: wallet.id,
      federationId: wallet.federationId,
      isOpen: wallet.isOpen(),
    })

    try {
      if (!wallet.federationId) {
        throw new Error(
          'Wallet must be joined to a federation before creating invoices',
        )
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

  return (
    <div className="section">
      <h3>Generate Lightning Invoice</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="amount">Amount (Msats):</label>
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

const RedeemEcash = ({ wallet }: { wallet: Wallet }) => {
  const [ecashInput, setEcashInput] = useState('')
  const [redeemResult, setRedeemResult] = useState('')
  const [redeemError, setRedeemError] = useState('')

  // Reset state when wallet changes
  useEffect(() => {
    setEcashInput('')
    setRedeemResult('')
    setRedeemError('')
  }, [wallet.id])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await wallet.mint.redeemEcash(ecashInput)
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
          className="ecash-input"
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

const SendLightning = ({ wallet }: { wallet: Wallet }) => {
  const [lightningInput, setLightningInput] = useState('')
  const [lightningResult, setLightningResult] = useState('')
  const [lightningError, setLightningError] = useState('')

  // Reset state when wallet changes
  useEffect(() => {
    setLightningInput('')
    setLightningResult('')
    setLightningError('')
  }, [wallet.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await wallet.lightning.payInvoice(lightningInput)
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
        <button type="submit">Pay</button>
      </form>
      {lightningResult && <div className="success">{lightningResult}</div>}
      {lightningError && <div className="error">{lightningError}</div>}
    </div>
  )
}

const ParseInviteCode = () => {
  const [parseInviteInput, setParseInviteInput] = useState('')
  const [parsedInviteData, setParsedInviteData] = useState<any>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')

  const parseInviteCode = async () => {
    if (!parseInviteInput.trim()) return

    setParsing(true)
    setError('')

    try {
      const data = await fedimintWallet.parseInviteCode(parseInviteInput)
      setParsedInviteData(data)
      console.log('Parsed invite code:', data)
    } catch (error) {
      console.error('Error parsing invite code:', error)
      setError(error instanceof Error ? error.message : String(error))
      setParsedInviteData(null)
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="section">
      <h3>Parse Invite Code</h3>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter invite code to parse"
          value={parseInviteInput}
          onChange={(e) => setParseInviteInput(e.target.value)}
        />
        <button onClick={parseInviteCode} disabled={parsing}>
          {parsing ? 'Parsing...' : 'Parse Invite Code'}
        </button>
      </div>
      {parsedInviteData && (
        <div className="success">
          <strong>Parsed Invite Code:</strong>
          <div>
            <strong>Federation ID:</strong> {parsedInviteData.federation_id}
          </div>
          <div>
            <strong>URL:</strong> {parsedInviteData.url}
          </div>
          <details>
            <summary>Full Details</summary>
            <pre>{JSON.stringify(parsedInviteData, null, 2)}</pre>
          </details>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

const ParseBolt11Invoice = () => {
  const [parseBolt11Input, setParseBolt11Input] = useState('')
  const [parsedBolt11Data, setParsedBolt11Data] = useState<any>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')

  const parseBolt11Invoice = async () => {
    if (!parseBolt11Input.trim()) return

    setParsing(true)
    setError('')

    try {
      const data = await fedimintWallet.parseBolt11Invoice(parseBolt11Input)
      setParsedBolt11Data(data)
      console.log('Parsed Bolt11 invoice:', data)
    } catch (error) {
      console.error('Error parsing Bolt11 invoice:', error)
      setError(error instanceof Error ? error.message : String(error))
      setParsedBolt11Data(null)
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="section">
      <h3>Parse Bolt11 Invoice</h3>
      <div className="input-group">
        <textarea
          placeholder="Enter Bolt11 invoice to parse (e.g. lnbc1...)"
          value={parseBolt11Input}
          onChange={(e) => setParseBolt11Input(e.target.value)}
          rows={3}
        />
        <button onClick={parseBolt11Invoice} disabled={parsing}>
          {parsing ? 'Parsing...' : 'Parse Bolt11 Invoice'}
        </button>
      </div>
      {parsedBolt11Data && (
        <div className="success">
          <strong>Parsed Bolt11 Invoice:</strong>
          <details>
            <summary>Full Details</summary>
            <pre>{JSON.stringify(parsedBolt11Data, null, 2)}</pre>
          </details>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default App
