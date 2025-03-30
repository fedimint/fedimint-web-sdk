import { createSignal, createEffect } from 'solid-js'
import { wallet } from './wallet'

export default function App() {
  const TESTNET_FEDERATION_CODE =
    'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

  const [open, setOpen] = createSignal(false)
  const [balance, setBalance] = createSignal(0)
  const [joining, setJoining] = createSignal(false)
  const [joinResult, setJoinResult] = createSignal('')
  const [joinError, setJoinError] = createSignal('')
  const [redeemResult, setRedeemResult] = createSignal('')
  const [redeemError, setRedeemError] = createSignal('')
  const [lightningResult, setLightningResult] = createSignal('')
  const [lightningError, setLightningError] = createSignal('')
  const [invoice, setInvoice] = createSignal('')
  const [error, setError] = createSignal('')
  const [generating, setGenerating] = createSignal(false)
  const [inviteCode, setInviteCode] = createSignal(TESTNET_FEDERATION_CODE)
  const [ecashInput, setEcashInput] = createSignal('')
  const [lightningInput, setLightningInput] = createSignal('')
  const [amount, setAmount] = createSignal(0)
  const [description, setDescription] = createSignal('')

  const checkIsOpen = () => {
    if (wallet.isOpen() !== open()) {
      setOpen(wallet.isOpen())
    }
  }

  createEffect(() => {
    const unsubscribe = wallet.balance.subscribeBalance((balance) => {
      checkIsOpen()
      setBalance(balance)
    })
    return () => {
      unsubscribe()
    }
  })

  const joinFederation = async (e: Event) => {
    e.preventDefault()
    checkIsOpen()
    console.log('Joining federation:', inviteCode())

    try {
      setJoining(true)
      const res = await wallet.joinFederation(inviteCode())
      console.log('join federation res', res)
      setJoinResult('Joined!')
    } catch (e) {
      console.log('Error joining federation', e)
      setJoinError(e instanceof Error ? e.message : String(e))
    } finally {
      setJoining(false)
    }
  }

  const handleRedeem = async (e: Event) => {
    e.preventDefault()
    try {
      const res = await wallet.mint.redeemEcash(ecashInput())
      console.log('redeem ecash res', res)
      setRedeemResult('Redeemed!')
    } catch (e) {
      console.log('Error redeeming ecash', e)
      setRedeemError(e instanceof Error ? e.message : String(e))
    }
  }

  const handlePay = async (e: Event) => {
    e.preventDefault()
    try {
      await wallet.lightning.payInvoice(lightningInput())
      setLightningResult('Paid!')
    } catch (e) {
      console.log('Error paying lightning', e)
      setLightningError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleGenerate = async (e: Event) => {
    e.preventDefault()
    setGenerating(true)
    setInvoice('')
    try {
      const response = await wallet.lightning.createInvoice(
        Number(amount()),
        description(),
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
    <>
      <header>
        <h1>Fedimint Typescript Library Demo</h1>

        <div class="steps">
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
        <div class="section">
          <h3>Wallet Status</h3>
          <div class="row">
            <strong>Is Wallet Open?</strong>
            <div>{open() ? 'Yes' : 'No'}</div>
            <button onClick={() => checkIsOpen()}>Check</button>
          </div>
          <div class="row">
            <strong>Balance:</strong>
            <div class="balance">{balance()}</div>
            sats
          </div>
        </div>

        <div class="section">
          <h3>Join Federation</h3>
          <form onSubmit={joinFederation} class="row">
            <input
              class="ecash-input"
              placeholder="Invite Code..."
              value={inviteCode()}
              onInput={(e) => {
                setInviteCode(e.target.value)
              }}
              required
              disabled={open()}
            />
            <button type="submit" disabled={open() || joining()}>
              Join
            </button>
          </form>
          {!joinResult && open() && <i>(You've already joined a federation)</i>}
          {joinResult() && <div class="success">{joinResult()}</div>}
          {joinError() && <div class="error">{joinError()}</div>}
        </div>

        <div class="section">
          <h3>Redeem Ecash</h3>
          <form onSubmit={handleRedeem} class="row">
            <input
              placeholder="Long ecash string..."
              onInput={(e) => {
                setEcashInput(e.target.value)
              }}
              required
            />
            <button type="submit">redeem</button>
          </form>
          {redeemResult() && <div class="success">{redeemResult()}</div>}
          {redeemError() && <div class="error">{redeemError()}</div>}
        </div>

        <div class="section">
          <h3>Pay Lightning</h3>
          <form onSubmit={handlePay} class="row">
            <input
              placeholder="lnbc..."
              onInput={(e) => {
                setLightningInput(e.target.value)
              }}
              required
            />
            <button type="submit">pay</button>
          </form>
          {lightningResult() && <div class="success">{lightningResult()}</div>}
          {lightningError() && <div class="error">{lightningError()}</div>}
        </div>

        <div class="section">
          <h3>Generate Lightning Invoice</h3>
          <form onSubmit={handleGenerate}>
            <div class="input-group">
              <label for="amount">Amount (sats):</label>
              <input
                id="amount"
                type="number"
                placeholder="Enter amount"
                onInput={(e) => {
                  setAmount(Number(e.target.value))
                }}
                required
              />
            </div>
            <div class="input-group">
              <label for="description">Description:</label>
              <input
                id="description"
                placeholder="Enter description"
                onInput={(e) => {
                  setDescription(e.target.value)
                }}
                required
              />
            </div>
            <button type="submit" disabled={generating()}>
              {generating() ? 'Generating...' : 'Generate Invoice'}
            </button>
          </form>
          <div>
            mutinynet faucet:{' '}
            <a href="https://faucet.mutinynet.com/" target="_blank">
              https://faucet.mutinynet.com/
            </a>
          </div>
          {invoice() && (
            <div class="success">
              <strong>Generated Invoice:</strong>
              <pre class="invoice-wrap">{invoice()}</pre>
              <button onClick={() => navigator.clipboard.writeText(invoice())}>
                Copy
              </button>
            </div>
          )}
          {error() && <div class="error">{error()}</div>}
        </div>
      </main>
    </>
  )
}
