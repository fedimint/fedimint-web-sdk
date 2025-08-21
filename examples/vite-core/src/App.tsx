import React, { useCallback, useEffect, useState } from 'react'
import {
  Wallet,
  joinFederation,
  openWallet,
  getWallet,
  getActiveWallets,
  listClients,
  previewFederation,
  parseInviteCode,
  parseBolt11Invoice,
  generateMnemonic,
  getMnemonic,
  setMnemonic,
  createWebWorkerTransport,
  recoverFederationFromScratch,
  createWalletDirector,
  loadWalletDirector,
} from '@fedimint/core-web'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// Custom hooks
const useBalance = (wallet: Wallet | undefined, isRecovering: boolean) => {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    setBalance(0)
    if (!wallet?.federationId || isRecovering) {
      return
    }

    // Fetch current balance immediately
    const fetchBalance = async () => {
      try {
        const currentBalance = await wallet.balance.getBalance()
        setBalance(currentBalance)
      } catch (error) {
        console.error('Error fetching balance:', error)
        setBalance(0)
      }
    }

    fetchBalance()

    // Subscribe to balance changes
    const unsubscribe = wallet.balance.subscribeBalance(
      (balance) => {
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
  }, [wallet, wallet?.federationId, isRecovering])

  return balance
}

const App = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [WalletInfo, setWalletInfo] = useState<
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
  const [recoveryProgress, setRecoveryProgress] = useState<
    Array<{
      module_id: number
      progress: any
      timestamp: number
    }>
  >([])
  const [recoveryPercentage, setRecoveryPercentage] = useState(0)
  const [isRecovering, setIsRecovering] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const balance = useBalance(activeWallet, isRecovering)

  // Initialize the wallet system on mount
  useEffect(() => {
    const initWallets = async () => {
      try {
        // Try to load existing wallets
        const loaded = await loadWalletDirector(createWebWorkerTransport)

        if (!loaded) {
          // Show onboarding if no wallets were loaded
          setShowOnboarding(true)
        } else {
          // Load active wallets if successful
          const existingWallets = getActiveWallets()
          setWallets(existingWallets)

          if (existingWallets.length > 0) {
            setActiveWallet(existingWallets[0])
          }
        }
      } catch (err) {
        console.error('Error initializing wallet system:', err)
        setError(err instanceof Error ? err.message : String(err))
      }
    }

    initWallets()
  }, [])

  // Handler for creating a new wallet from onboarding
  const handleCreateNewWallet = async () => {
    try {
      await createWalletDirector(createWebWorkerTransport)
      const mnemonic = await getMnemonic()

      if (!mnemonic) {
        throw new Error('Failed to get mnemonic')
      }

      const mnemonicStrings = mnemonic.map((word) => String(word))
      setShowOnboarding(false)

      alert(
        'IMPORTANT: Please write down your recovery phrase and keep it safe:\n\n' +
          mnemonicStrings.join(' '),
      )
    } catch (error) {
      console.error('Error creating new wallet:', error)
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  // Handler for recovering an existing wallet from onboarding
  const handleRecoverWallet = async () => {
    try {
      // Ask user for their recovery phrase
      const mnemonicString = prompt(
        'Enter your 12 or 24 word recovery phrase (words separated by spaces):',
      )

      if (!mnemonicString) {
        return // User cancelled
      }

      // Convert to array and set the mnemonic
      const mnemonic = mnemonicString.trim().split(/\s+/)
      await createWalletDirector(createWebWorkerTransport, mnemonic)

      setShowOnboarding(false)
    } catch (error) {
      console.error('Error recovering wallet:', error)
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  // Load wallet pointers on mount and refresh periodically
  useEffect(() => {
    const loadWalletInfo = () => {
      const pointers = listClients()
      setWalletInfo(pointers)
    }

    loadWalletInfo()

    // Refresh wallet pointers periodically
    const interval = setInterval(loadWalletInfo, 5000)
    return () => clearInterval(interval)
  }, [])

  // Wallet management functions
  const openWalletById = useCallback(
    async (walletId: string) => {
      try {
        const wallet = await openWallet(walletId)
        const existingWallet = wallets.find((w) => w.id === walletId)
        if (!existingWallet) {
          setWallets((prev) => [...prev, wallet])
        }
        setActiveWallet(wallet)
        setWalletId('')
        setError('')
        // Refresh wallet pointers after opening
        setWalletInfo(listClients())
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
      let wallet = getWallet(walletId)

      if (!wallet) {
        // If not in memory, open it
        console.log(`Opening wallet ${walletId} from storage`)
        wallet = await openWallet(walletId)

        // Add to wallets array if not already there
        if (wallet) {
          setWallets((prev) => {
            const existingWallet = prev.find((w) => w.id === walletId)
            if (!existingWallet) {
              console.log(`Adding wallet ${walletId} to wallets array`)
              return [...prev, wallet!]
            }
            return prev
          })
        }
      }

      // Update active wallet
      console.log(
        `Setting active wallet to ${wallet.id} with federation ${wallet.federationId}`,
      )
      setActiveWallet(wallet)

      // Refresh wallet pointers after selecting
      setWalletInfo(listClients())
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
      await openWalletById(walletId)
    } catch (error) {
      console.error('Error opening wallet:', error)
    } finally {
      setOpening(false)
    }
  }

  // Handle wallet creation from federation join
  const handleWalletCreated = useCallback((wallet: Wallet) => {
    setWallets((prev) => {
      const existingWallet = prev.find((w) => w.id === wallet.id)
      if (!existingWallet) {
        return [...prev, wallet]
      }
      return prev
    })
    setActiveWallet(wallet)
    // Refresh wallet pointers after creating
    setWalletInfo(listClients())
  }, [])

  useEffect(() => {
    const existingWallets = getActiveWallets()
    setWallets(existingWallets)
    if (existingWallets.length > 0 && !activeWallet) {
      setActiveWallet(existingWallets[0])
    }
  }, [activeWallet])

  // Handle recovery progress subscription for active wallet
  useEffect(() => {
    if (!activeWallet) {
      setRecoveryProgress([])
      setRecoveryPercentage(0)
      setIsRecovering(false)
      return
    }

    // Check if there are pending recoveries
    const checkRecovery = async () => {
      try {
        const hasPending = await activeWallet.recovery.hasPendingRecoveries()
        setIsRecovering(hasPending)
      } catch (error) {
        console.error('Error checking pending recoveries:', error)
      }
    }

    checkRecovery()

    // Subscribe to recovery progress for the active wallet
    // Track both overall percentage and per-module details
    let overallPercentage = 0
    const moduleProgressMap = new Map<
      number,
      { complete: number; total: number; percentage: number }
    >()

    const unsubscribe = activeWallet.recovery.subscribeToRecoveryProgress(
      (progress) => {
        // Add to the progress events array for compatibility
        setRecoveryProgress((prev) => [
          ...prev,
          {
            module_id: progress.module_id,
            progress: progress.progress,
            timestamp: Date.now(),
          },
        ])

        // Calculate overall percentage based on module with lowest progress
        try {
          if (
            typeof progress.progress === 'object' &&
            progress.progress !== null &&
            'complete' in progress.progress &&
            'total' in progress.progress &&
            typeof progress.progress.complete === 'number' &&
            typeof progress.progress.total === 'number'
          ) {
            const moduleId = progress.module_id
            const complete = progress.progress.complete
            const total = progress.progress.total

            // Handle the 0/0 case - treat as 0% complete
            let percentage = 0
            if (total > 0) {
              percentage = Math.min(100, (complete / total) * 100)
            }

            // Update the progress for this module
            moduleProgressMap.set(moduleId, { complete, total, percentage })

            // Calculate the minimum percentage across all modules
            let minPercentage = 100
            moduleProgressMap.forEach((p) => {
              minPercentage = Math.min(minPercentage, p.percentage)
            })

            // Only update state if percentage has changed
            if (minPercentage !== overallPercentage) {
              overallPercentage = minPercentage
              setRecoveryPercentage(minPercentage)
            }
          }
        } catch (err) {
          console.error('Error calculating recovery percentage:', err)
        }
      },
      (error) => {
        console.error('Recovery progress error:', error)
        setIsRecovering(false)
      },
    )

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [activeWallet])

  return (
    <>
      <OnboardingModal
        isVisible={showOnboarding}
        onCreateNewWallet={handleCreateNewWallet}
        onRecoverWallet={handleRecoverWallet}
      />

      <header>
        <h1>Fedimint Typescript Library Demo</h1>

        <div className="steps">
          <strong>Steps to get started:</strong>
          <ol>
            <li>
              Join a Federation (creates wallet and persists across sessions)
            </li>
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
        <RecoveryProgress
          recoveryProgress={recoveryProgress}
          isRecovering={isRecovering}
          recoveryPercentage={recoveryPercentage}
        />
        <MnemonicManager />

        <JoinFederation onWalletCreated={handleWalletCreated} />
        <WalletManagement
          wallets={wallets}
          WalletInfo={WalletInfo}
          activeWallet={activeWallet}
          walletId={walletId}
          opening={opening}
          onSelectWallet={selectWallet}
          onOpenWallet={handleOpenWallet}
          onWalletIdChange={setWalletId}
        />

        {activeWallet && (
          <>
            <WalletStatus wallet={activeWallet} balance={balance} />
            <GenerateLightningInvoice wallet={activeWallet} />
            <RedeemEcash wallet={activeWallet} />
            <SendLightning wallet={activeWallet} />
            <BackupToFederation wallet={activeWallet} />
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
  WalletInfo,
  activeWallet,
  walletId,
  opening,
  onSelectWallet,
  onOpenWallet,
  onWalletIdChange,
}: {
  wallets: Wallet[]
  WalletInfo: Array<{
    id: string
    clientName: string
    federationId?: string
    createdAt: number
    lastAccessedAt: number
  }>
  activeWallet: Wallet | undefined
  walletId: string
  opening: boolean
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

      {/* Open Wallet Form - only show if there are existing wallets */}
      {WalletInfo.length > 0 && (
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
      )}

      {/* Wallet Pointers List */}
      {WalletInfo.length > 0 && (
        <div className="wallet-list">
          <h4>Available Wallets ({WalletInfo.length}):</h4>
          <div className="wallet-grid">
            {WalletInfo.map((pointer) => (
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
  balance,
}: {
  wallet: Wallet
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
        <div>
          {wallet.federationId
            ? `${wallet.federationId.slice(0, 16)}...`
            : 'Not joined'}
        </div>
      </div>
    </div>
  )
}

const JoinFederation = ({
  onWalletCreated,
}: {
  onWalletCreated: (wallet: Wallet) => void
}) => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewing, setPreviewing] = useState(false)
  const [joinResult, setJoinResult] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)
  const [recover, setRecover] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecover(e.target.checked)
  }

  const previewFederationHandler = async () => {
    if (!inviteCode.trim()) return

    setPreviewing(true)
    setJoinError('')

    try {
      const data = await previewFederation(inviteCode)
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

  const joinFederationHandler = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Joining federation and creating wallet:', inviteCode)
    try {
      setJoining(true)
      setJoinError('')
      if (recover) {
        const wallet = await recoverFederationFromScratch(inviteCode)
        setJoinResult('Recovering Federation with Wallet: ' + wallet.id)
        onWalletCreated(wallet)
      } else {
        const wallet = await joinFederation(inviteCode)
        setJoinResult(
          'Successfully joined Federation with Wallet ID : ' + wallet.id,
        )
        onWalletCreated(wallet)
      }
    } catch (e: any) {
      console.log('Error joining federation and creating wallet', e)
      setJoinError(typeof e === 'object' ? e.toString() : (e as string))
      setJoinResult('')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="section">
      <h3>Create a new wallet</h3>
      <form onSubmit={joinFederationHandler}>
        <input
          placeholder="Invite Code..."
          required
          value={inviteCode}
          onChange={(e) => {
            setInviteCode(e.target.value)
            setPreviewData(null)
          }}
        />
        <div>
          <input type="checkbox" checked={recover} onChange={handleChange} />
          Recover
        </div>
        <div className="button-group">
          <button
            type="button"
            onClick={previewFederationHandler}
            disabled={previewing || !inviteCode.trim()}
          >
            {previewing ? 'Previewing...' : 'Preview Federation'}
          </button>
          <button type="submit" disabled={joining}>
            {joining ? 'Joining Federation' : 'Join Federation'}
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

    try {
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

const BackupToFederation = ({ wallet }: { wallet: Wallet }) => {
  const [metadata, setMetadata] = useState('')
  const [backupResult, setBackupResult] = useState('')
  const [backupError, setBackupError] = useState('')
  const [isBackingUp, setIsBackingUp] = useState(false)

  // Reset state when wallet changes
  useEffect(() => {
    setMetadata('')
    setBackupResult('')
    setBackupError('')
  }, [wallet.id])

  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBackingUp(true)
    setBackupError('')
    setBackupResult('')

    try {
      let metadataObj: any = {}

      // Try to parse metadata as JSON if provided, otherwise use as string
      if (metadata.trim()) {
        try {
          metadataObj = JSON.parse(metadata)
        } catch {
          // If JSON parsing fails, use as a string value
          metadataObj = { description: metadata }
        }
      }

      await wallet.recovery.backupToFederation(metadataObj)
      setBackupResult('Backup completed successfully!')
      console.log('Backup to federation successful')
    } catch (error) {
      console.error('Error backing up to federation:', error)
      setBackupError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsBackingUp(false)
    }
  }

  return (
    <div className="section">
      <h3>Backup to Federation</h3>
      <form onSubmit={handleBackup}>
        <div className="input-group">
          <textarea
            placeholder="Optional metadata (JSON object or plain text)"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
          <small style={{ color: '#666', fontSize: '0.9em' }}>
            You can provide metadata as JSON (e.g.,{' '}
            {JSON.stringify({
              description: 'My backup',
              timestamp: Date.now(),
            })}
            ) or plain text
          </small>
        </div>
        <button type="submit" disabled={isBackingUp}>
          {isBackingUp ? 'Backing up...' : 'Backup to Federation'}
        </button>
      </form>
      {backupResult && <div className="success">{backupResult}</div>}
      {backupError && <div className="error">{backupError}</div>}
    </div>
  )
}

const ParseInviteCode = () => {
  const [parseInviteInput, setParseInviteInput] = useState('')
  const [parsedInviteData, setParsedInviteData] = useState<any>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')

  const parseInviteCodeHandler = async () => {
    if (!parseInviteInput.trim()) return

    setParsing(true)
    setError('')

    try {
      const data = await parseInviteCode(parseInviteInput)
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
        <button onClick={parseInviteCodeHandler} disabled={parsing}>
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

  const parseBolt11InvoiceHandler = async () => {
    if (!parseBolt11Input.trim()) return

    setParsing(true)
    setError('')

    try {
      const data = await parseBolt11Invoice(parseBolt11Input)
      setParsedBolt11Data(data)
      console.log(data.amount)
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
        <button onClick={parseBolt11InvoiceHandler} disabled={parsing}>
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

const RecoveryProgress = ({
  recoveryProgress,
  isRecovering,
  recoveryPercentage,
}: {
  recoveryProgress: Array<{
    module_id: number
    progress: any
    timestamp: number
  }>
  isRecovering: boolean
  recoveryPercentage: number
}) => {
  if (!isRecovering && recoveryProgress.length === 0) {
    return null
  }

  return (
    <div className="section">
      <h3>🔄 Recovery Progress</h3>

      {isRecovering && (
        <>
          {/* Overall Recovery Progress Bar */}
          <div className="recovery-progress">
            <h4>📊 Overall Recovery Progress</h4>

            <div className="recovery-progress-status">
              <span
                className={
                  recoveryPercentage === 0
                    ? 'initializing'
                    : recoveryPercentage >= 100
                      ? 'complete'
                      : ''
                }
              >
                {recoveryPercentage === 0 ? (
                  <>
                    Initializing
                    <span className="dot-animation">...</span>
                  </>
                ) : (
                  `${recoveryPercentage.toFixed(1)}%`
                )}
              </span>
            </div>

            <div className="recovery-progress-bar">
              <div
                className={`recovery-progress-fill ${recoveryPercentage === 0 ? 'progress-pulse' : ''} ${recoveryPercentage >= 100 ? 'complete' : ''}`}
                style={{
                  width:
                    recoveryPercentage === 0
                      ? '5%'
                      : `${Math.min(recoveryPercentage, 100)}%`,
                  transition:
                    recoveryPercentage === 0 ? 'none' : 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const MnemonicManager = () => {
  const [mnemonicState, setMnemonicState] = useState<string>('')
  const [inputMnemonic, setInputMnemonic] = useState<string>('')
  const [activeAction, setActiveAction] = useState<
    'get' | 'set' | 'generate' | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  }>()
  const [showMnemonic, setShowMnemonic] = useState(false)

  const clearMessage = () => setMessage(undefined)

  // Helper function to extract user-friendly error messages
  const extractErrorMessage = (error: any): string => {
    let errorMsg = 'Operation failed'

    if (error instanceof Error) {
      errorMsg = error.message
    } else if (typeof error === 'object' && error !== null) {
      // Handle RPC error objects
      const rpcError = error as any
      if (rpcError.error) {
        errorMsg = rpcError.error
      } else if (rpcError.message) {
        errorMsg = rpcError.message
      }
    }

    return errorMsg
  }

  const handleAction = async (action: 'get' | 'set' | 'generate') => {
    if (activeAction === action) {
      setActiveAction(null)
      return
    }
    setActiveAction(action)
    clearMessage()

    if (action === 'get') {
      await handleGetMnemonic()
    } else if (action === 'generate') {
      await handleGenerateMnemonic()
    }
  }

  const handleGenerateMnemonic = async () => {
    setIsLoading(true)
    try {
      const newMnemonic = await generateMnemonic()
      setMnemonicState(newMnemonic.join(' '))
      setMessage({ text: 'New mnemonic generated!', type: 'success' })
      setShowMnemonic(true)
    } catch (error) {
      console.error('Error generating mnemonic:', error)
      const errorMsg = extractErrorMessage(error)
      setMessage({ text: errorMsg, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetMnemonic = async () => {
    setIsLoading(true)
    try {
      const mnemonic = await getMnemonic()
      if (mnemonic && mnemonic.length > 0) {
        setMnemonicState(mnemonic.join(' '))
        setMessage({ text: 'Mnemonic retrieved!', type: 'success' })
        setShowMnemonic(true)
      } else {
        setMessage({ text: 'No mnemonic found', type: 'error' })
      }
    } catch (error) {
      console.error('Error getting mnemonic:', error)
      const errorMsg = extractErrorMessage(error)
      setMessage({ text: errorMsg, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetMnemonic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMnemonic.trim()) return

    setIsLoading(true)
    try {
      const words = inputMnemonic.trim().split(/\s+/)
      await setMnemonic(words)
      setMessage({ text: 'Mnemonic set successfully!', type: 'success' })
      setInputMnemonic('')
      setMnemonicState(words.join(' '))
      setActiveAction(null)
    } catch (error) {
      console.error('Error setting mnemonic:', error)
      const errorMsg = extractErrorMessage(error)
      setMessage({ text: errorMsg, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonicState)
      setMessage({ text: 'Copied to clipboard!', type: 'success' })
    } catch (error) {
      setMessage({ text: 'Failed to copy', type: 'error' })
    }
  }

  return (
    <div className="section mnemonic-section">
      <h3>🔑 Mnemonic Manager</h3>

      <div className="mnemonic-buttons">
        <button
          onClick={() => handleAction('get')}
          disabled={isLoading}
          className={`btn ${activeAction === 'get' ? 'active' : ''}`}
        >
          Get
        </button>
        <button
          onClick={() => handleAction('set')}
          disabled={isLoading}
          className={`btn ${activeAction === 'set' ? 'active' : ''}`}
        >
          Set
        </button>
        <button
          onClick={() => handleAction('generate')}
          disabled={isLoading}
          className={`btn ${activeAction === 'generate' ? 'active' : ''}`}
        >
          Generate
        </button>
      </div>

      {activeAction === 'set' && (
        <form onSubmit={handleSetMnemonic} className="mnemonic-form">
          <textarea
            placeholder="Enter 12 or 24 words separated by spaces"
            value={inputMnemonic}
            onChange={(e) => setInputMnemonic(e.target.value)}
            rows={2}
            className="mnemonic-input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMnemonic.trim()}
            className="btn btn-primary"
          >
            {isLoading ? 'Setting...' : 'Set Mnemonic'}
          </button>
        </form>
      )}

      {mnemonicState && (
        <div className="mnemonic-display">
          <div className="mnemonic-output">
            <span className={showMnemonic ? '' : 'blurred'}>
              {mnemonicState}
            </span>
            <div className="mnemonic-actions">
              <button
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="btn btn-small"
                title={showMnemonic ? 'Hide mnemonic' : 'Show mnemonic'}
              >
                {showMnemonic ? '👁️' : '👁️‍🗨️'}
              </button>
              <button
                onClick={copyToClipboard}
                className="btn btn-small"
                disabled={!showMnemonic}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}
    </div>
  )
}

// Custom Onboarding Modal component
const OnboardingModal = ({
  isVisible,
  onCreateNewWallet,
  onRecoverWallet,
}: {
  isVisible: boolean
  onCreateNewWallet: () => Promise<void>
  onRecoverWallet: () => Promise<void>
}) => {
  if (!isVisible) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Welcome to Fedimint Wallet</h2>
        <p>No wallets found. Please choose an option:</p>
        <div className="modal-buttons">
          <button className="button primary" onClick={onCreateNewWallet}>
            Create New Wallet
          </button>
          <button className="button secondary" onClick={onRecoverWallet}>
            Recover Existing Wallet
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
