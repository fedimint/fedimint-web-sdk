import init, { RpcHandle, WasmClient } from '../wasm/fedimint_client_wasm.js'

type StreamError = {
  error: string
  data: never
}

type StreamSuccess = {
  data: {} | [] | null | undefined | number | string | boolean
  error: never
}

type StreamResult = StreamSuccess | StreamError

type Body = string | null | Record<string, string | null>

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private _fed: WasmClient | null = null
  private initPromise: Promise<void> | null = null
  private openPromise: Promise<void> | null = null
  private resolveOpen: () => void = () => {}

  constructor(lazy: boolean = false) {
    if (lazy) return
    this.initialize()
    this.openPromise = new Promise((resolve) => {
      this.resolveOpen = resolve
    })
  }

  // Setup
  async initialize() {
    if (this.initPromise) return this.initPromise
    // this.worker = new Worker(new URL('./wasm.worker.ts', import.meta.url))
    this.initPromise = init().then(() => {
      console.trace('Fedimint Client Wasm Initialization complete')
    })
    return this.initPromise
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    await this.initialize()
    const wasm = await WasmClient.open(clientName)

    if (wasm === undefined) return false
    this._fed = wasm
    this.resolveOpen()
    return true
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this.initialize()
    this._fed = await WasmClient.join_federation(clientName, inviteCode)
    this.resolveOpen()
  }

  // RPC
  private async _rpcStream(
    module: string,
    method: string,
    body: Body = {},
    onSuccess: (res: StreamSuccess['data']) => void,
    onError: (res: StreamError['error']) => void,
  ): Promise<RpcHandle> {
    await this.openPromise
    if (!this._fed) throw new Error('FedimintWallet is not open')
    const unsubscribe = await this._fed.rpc(
      module,
      method,
      JSON.stringify(body),
      (res: string) => {
        const parsed = JSON.parse(res) as StreamResult
        if (parsed.error) {
          onError(parsed.error)
        } else {
          onSuccess(parsed.data)
        }
      },
    )
    return unsubscribe
  }

  private async _rpcSingle(module: string, method: string, body: Body = {}) {
    return new Promise((resolve, reject) => {
      if (!this._fed) return reject('FedimintWallet is not open')
      this._fed.rpc(module, method, JSON.stringify(body), (res: string) => {
        const parsed = JSON.parse(res) as StreamResult
        if (parsed.error) {
          reject(parsed.error)
        } else {
          resolve(parsed.data)
        }
      })
    })
  }

  // Client

  async getBalance(): Promise<number> {
    return (await this._rpcSingle('', 'get_balance')) as number
  }

  // LN

  async payInvoice(invoice: string): Promise<void> {
    await this._rpcSingle('ln', 'pay_bolt11_invoice', {
      invoice,
    })
  }

  // async listGateways() {
  //   return await this._rpcSingle("ln", "list_gateways");
  // }
  //
  // async verifyGateways() {
  //   return await this._rpcSingle("ln", "verify_gateway_availability");
  // }

  // Mint

  async redeemEcash(notes: string): Promise<void> {
    await this._rpcSingle('mint', 'reissue_external_notes', {
      oob_notes: notes, // "out of band notes"
      extra_meta: null,
    })
  }

  // Teardown
  async cleanup() {
    await this._fed?.free()
  }

  isOpen() {
    return this._fed !== null
  }

  // Streaming

  subscribeBalance(
    onSuccess: (balance: number) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream(
      '',
      'subscribe_balance_changes',
      {},
      (res) => onSuccess(parseInt(res as string)),
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }
}
