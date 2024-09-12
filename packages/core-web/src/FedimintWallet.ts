import { type RpcHandle } from '../wasm/fedimint_client_wasm.js'
import {
  JSONValue,
  JSONObject,
  LightningGateway,
  OutgoingLightningPayment,
  LnPayState,
  LnReceiveState,
  StreamResult,
  StreamError,
  CreateBolt11Response,
  ModuleKind,
  GatewayInfo,
} from './types/wallet.js'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private openPromise: Promise<void> | null = null
  private resolveOpen: () => void = () => {}
  private requestCounter: number = 0
  private requestCallbacks: Map<number, (value: any) => void> = new Map()

  constructor(lazy: boolean = false) {
    if (lazy) return
    this.initialize()
    this.openPromise = new Promise((resolve) => {
      this.resolveOpen = resolve
    })
  }

  private getNextRequestId(): number {
    return ++this.requestCounter
  }

  private sendMessage(type: string, payload?: any): Promise<any> {
    return new Promise((resolve) => {
      const requestId = this.getNextRequestId()
      this.requestCallbacks.set(requestId, resolve)
      this.worker!.postMessage({ type, payload, requestId })
    })
  }

  // Setup
  async initialize() {
    if (this.initPromise) return this.initPromise
    this.worker = new Worker(new URL('./worker.js', import.meta.url))
    this.worker.onmessage = this.handleWorkerMessage.bind(this)
    this.initPromise = this.sendMessage('init')
    return this.initPromise
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, requestId, ...data } = event.data
    const callback = this.requestCallbacks.get(requestId)
    if (callback) {
      callback(data)
      this.requestCallbacks.delete(requestId)
    }
    if (type === 'rpcResponse') {
      // Handle streaming RPC responses
      const streamCallback = this.requestCallbacks.get(requestId)
      if (streamCallback) {
        streamCallback(data.response)
      }
    }
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    await this.initialize()
    const { success } = await this.sendMessage('open', { clientName })
    if (success) this.resolveOpen()
    return success
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this.initialize()
    const { success } = await this.sendMessage('join', {
      inviteCode,
      clientName,
    })
    if (success) this.resolveOpen()
  }

  // RPC
  private async _rpcStream<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
  ): Promise<RpcHandle> {
    await this.openPromise
    if (!this.worker) throw new Error('FedimintWallet is not open')

    const requestId = this.getNextRequestId()
    this.requestCallbacks.set(requestId, (response: string) => {
      const parsed = JSON.parse(response) as StreamResult<Response>
      if (parsed.error) {
        onError(parsed.error)
      } else {
        onSuccess(parsed.data)
      }
    })

    const { unsubscribe } = await this.sendMessage('rpc', {
      module,
      method,
      body,
      requestId,
    })
    return unsubscribe
  }

  private async _rpcSingle<Response extends JSONValue = JSONValue>(
    module: ModuleKind,
    method: string,
    body: JSONValue,
  ): Promise<Response> {
    const { response } = await this.sendMessage('rpc', { module, method, body })
    const parsed = JSON.parse(response) as StreamResult<Response>
    if (parsed.error) {
      throw new Error(parsed.error)
    }
    return parsed.data
  }

  async getBalance(): Promise<number> {
    return await this._rpcSingle('', 'get_balance', {})
  }

  // Mint module methods

  async redeemEcash(notes: string): Promise<void> {
    await this._rpcSingle('mint', 'reissue_external_notes', {
      oob_notes: notes, // "out of band notes"
      extra_meta: null,
    })
  }

  async reissueExternalNotes(
    oobNotes: string,
    extraMeta: JSONObject,
  ): Promise<string> {
    return await this._rpcSingle('mint', 'reissue_external_notes', {
      oob_notes: oobNotes,
      extra_meta: extraMeta,
    })
  }

  subscribeReissueExternalNotes(
    operationId: string,
    onSuccess: (state: JSONValue) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    type ReissueExternalNotesState =
      | 'Created'
      | 'Issuing'
      | 'Done'
      | { Failed: { error: string } }

    const unsubscribe = this._rpcStream<ReissueExternalNotesState>(
      'mint',
      'subscribe_reissue_external_notes',
      { operation_id: operationId },
      (res) => onSuccess(res),
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  async spendNotes(
    minAmount: number,
    tryCancelAfter: number,
    includeInvite: boolean,
    extraMeta: JSONValue,
  ): Promise<JSONValue> {
    return await this._rpcSingle('mint', 'spend_notes', {
      min_amount: minAmount,
      try_cancel_after: tryCancelAfter,
      include_invite: includeInvite,
      extra_meta: extraMeta,
    })
  }

  async validateNotes(oobNotes: string): Promise<number> {
    return await this._rpcSingle('mint', 'validate_notes', {
      oob_notes: oobNotes,
    })
  }

  async tryCancelSpendNotes(operationId: string): Promise<void> {
    await this._rpcSingle('mint', 'try_cancel_spend_notes', {
      operation_id: operationId,
    })
  }

  subscribeSpendNotes(
    operationId: string,
    onSuccess: (state: JSONValue) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream(
      'mint',
      'subscribe_spend_notes',
      { operation_id: operationId },
      (res) => onSuccess(res),
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  async awaitSpendOobRefund(operationId: string): Promise<JSONValue> {
    return await this._rpcSingle('mint', 'await_spend_oob_refund', {
      operation_id: operationId,
    })
  }

  /**
   * This should ONLY be called when UNLOADING the wallet client.
   * After this call, the FedimintWallet instance should be discarded.
   */
  async cleanup() {
    this.worker?.terminate()
    this.worker = null
    this.openPromise = null
    this.requestCallbacks.clear()
  }

  isOpen() {
    return this.worker !== null
  }

  async getConfig(): Promise<JSONValue> {
    return await this._rpcSingle('', 'get_config', {})
  }

  async getFederationId(): Promise<string> {
    return await this._rpcSingle('', 'get_federation_id', {})
  }

  async getInviteCode(peer: number): Promise<string | null> {
    return await this._rpcSingle('', 'get_invite_code', { peer })
  }

  async listOperations(): Promise<JSONValue[]> {
    return await this._rpcSingle('', 'list_operations', {})
  }

  async hasPendingRecoveries(): Promise<boolean> {
    return await this._rpcSingle('', 'has_pending_recoveries', {})
  }

  async waitForAllRecoveries(): Promise<void> {
    await this._rpcSingle('', 'wait_for_all_recoveries', {})
  }

  /// STREAMING RPCs --------------------

  subscribeBalance(
    onSuccess: (balance: number) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream<string>(
      '',
      'subscribe_balance_changes',
      {},
      (res) => onSuccess(parseInt(res)),
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  subscribeToRecoveryProgress(
    onSuccess: (progress: {
      module_id: number
      progress: JSONValue
    }) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream<{
      module_id: number
      progress: JSONValue
    }>('', 'subscribe_to_recovery_progress', {}, onSuccess, onError)

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  // Lightning Network module methods

  async createBolt11InvoiceWithGateway(
    amount: number,
    description: string,
    expiryTime: number | null = null,
    extraMeta: JSONObject = {},
    gatewayInfo: GatewayInfo,
  ) {
    return await this._rpcSingle('ln', 'create_bolt11_invoice', {
      amount,
      description,
      expiry_time: expiryTime,
      extra_meta: extraMeta,
      gateway: gatewayInfo,
    })
  }

  async createBolt11Invoice(
    amount: number,
    description: string,
    expiryTime: number | null = null,
    extraMeta: JSONObject = {},
  ): Promise<CreateBolt11Response> {
    await this.updateGatewayCache()
    const gateway = await this._getDefaultGatewayInfo()
    return await this._rpcSingle('ln', 'create_bolt11_invoice', {
      amount,
      description,
      expiry_time: expiryTime,
      extra_meta: extraMeta,
      gateway,
    })
  }

  async payBolt11InvoiceWithGateway(
    invoice: string,
    gatewayInfo: GatewayInfo,
    extraMeta: JSONObject = {},
  ) {
    return await this._rpcSingle('ln', 'pay_bolt11_invoice', {
      maybe_gateway: gatewayInfo,
      invoice,
      extra_meta: extraMeta,
    })
  }

  async _getDefaultGatewayInfo(): Promise<LightningGateway> {
    const gateways = await this.listGateways()
    return gateways[0]
  }

  async payBolt11Invoice(
    invoice: string,
    extraMeta: JSONObject = {},
  ): Promise<OutgoingLightningPayment> {
    await this.updateGatewayCache()
    const gateway = await this._getDefaultGatewayInfo()
    return await this._rpcSingle('ln', 'pay_bolt11_invoice', {
      maybe_gateway: gateway.info,
      invoice,
      extra_meta: extraMeta,
    })
  }

  subscribeLnPay(
    operationId: string,
    onSuccess: (state: LnPayState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream(
      'ln',
      'subscribe_ln_pay',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  subscribeLnReceive(
    operationId: string,
    onSuccess: (state: LnReceiveState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream(
      'ln',
      'subscribe_ln_receive',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  async getGateway(
    gatewayId: string | null = null,
    forceInternal: boolean = false,
  ): Promise<LightningGateway | null> {
    return await this._rpcSingle('ln', 'get_gateway', {
      gateway_id: gatewayId,
      force_internal: forceInternal,
    })
  }

  async listGateways(): Promise<LightningGateway[]> {
    return await this._rpcSingle('ln', 'list_gateways', {})
  }

  async updateGatewayCache(): Promise<void> {
    console.trace('Updating gateway cache')
    await this._rpcSingle('ln', 'update_gateway_cache', {})
  }
}
