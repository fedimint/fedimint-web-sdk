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
  CancelFunction,
} from './types/wallet.js'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private openPromise: Promise<void>
  private resolveOpen: () => void = () => {}
  private _isOpen: boolean = false
  private requestCounter: number = 0
  private requestCallbacks: Map<number, (value: any) => void> = new Map()

  constructor(lazy: boolean = false, open: boolean = true) {
    this.openPromise = new Promise((resolve) => {
      this.resolveOpen = resolve
    })
    if (lazy) return
    this.initialize()
  }

  async waitForOpen() {
    if (this._isOpen) return
    return this.openPromise
  }

  private getNextRequestId(): number {
    return ++this.requestCounter
  }

  // Sends a single message and deletes the request callback
  // The first response
  private sendSingleMessage(type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = this.getNextRequestId()
      this.requestCallbacks.set(requestId, (data) => {
        this.requestCallbacks.delete(requestId)
        resolve(data)
      })
      try {
        this.worker!.postMessage({ type, payload, requestId })
      } catch (e) {
        reject(e)
      }
    })
  }

  // private sendOpenMessage(type: string, payload?: any): Promise<any> {
  //   return new Promise((resolve) => {
  //     const requestId = this.getNextRequestId()
  //     this.requestCallbacks.set(requestId, resolve)
  //     this.worker!.postMessage({ type, payload, requestId })
  //   })
  // }

  // Setup
  async initialize() {
    if (this.initPromise) return this.initPromise
    this.worker = new Worker(new URL('./worker.js', import.meta.url))
    this.worker.onmessage = this.handleWorkerMessage.bind(this)
    this.initPromise = this.sendSingleMessage('init')
    return this.initPromise
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, requestId, ...data } = event.data
    const streamCallback = this.requestCallbacks.get(requestId)
    // TODO: Handle errors... maybe have another callbacks list for errors?
    if (streamCallback) {
      streamCallback(data.data)
    }
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    await this.initialize()
    // TODO: Determine if this should be safe or throw
    if (this._isOpen)
      throw new Error(
        'The FedimintWallet is already open. You can only call `FedimintWallet.open on closed clients.`',
      )
    const { success } = await this.sendSingleMessage('open', { clientName })
    if (success) {
      this._isOpen = !!success
      this.resolveOpen()
    }
    return success
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this.initialize()
    // TODO: Determine if this should be safe or throw
    if (this._isOpen)
      throw new Error(
        'Failed to Join Federation. You have already joined a federation, and you can only join one federation per wallet.',
      )
    const response = await this.sendSingleMessage('join', {
      inviteCode,
      clientName,
    })
    // if (success) this.resolveOpen()
    if (response.success) this._isOpen = true
  }
  // private sendOpenMessage(type: string, payload?: any): Promise<any> {
  //   return new Promise((resolve) => {
  //     const requestId = this.getNextRequestId()
  //     this.requestCallbacks.set(requestId, resolve)
  //     this.worker!.postMessage({ type, payload, requestId })
  //   })
  // }

  // RPC
  private _rpcStream<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
    onEnd: () => void = () => {},
  ): CancelFunction {
    const requestId = this.getNextRequestId()
    this._rpcStreamInner(
      requestId,
      module,
      method,
      body,
      onSuccess,
      onError,
      onEnd,
    )
    const unsubscribe = () => {
      ///
    }
    return unsubscribe
  }

  private async _rpcStreamInner<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    requestId: number,
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
    onEnd: () => void = () => {},
  ): Promise<CancelFunction> {
    await this.openPromise
    if (!this.worker || !this._isOpen)
      throw new Error('FedimintWallet is not open')

    this.requestCallbacks.set(requestId, (response: StreamResult<Response>) => {
      // const parsed = JSON.parse(response) as StreamResult<Response>
      // console.log('parsed', parsed)
      if (response.error !== undefined) {
        onError(response.error)
      } else if (response.data !== undefined) {
        onSuccess(response.data)
      } else if (response.end !== undefined) {
        this.requestCallbacks.delete(requestId)
        onEnd()
      }
    })
    // this.requestCallbacks.set(requestId, resolve)
    this.worker.postMessage({
      type: 'rpc',
      payload: { module, method, body },
      requestId,
    })

    return () => {
      console.trace('UNSUBSCRIBING', requestId)
      this.worker?.postMessage({
        type: 'unsubscribe',
        requestId,
      })
      this.requestCallbacks.delete(requestId)
    }

    // const { unsubscribe } = await this.sendMessage('rpc', {
    //   module,
    //   method,
    //   body,
    //   requestId,
    // })
    // return unsubscribe
  }

  private async _rpcSingle<Response extends JSONValue = JSONValue>(
    module: ModuleKind,
    method: string,
    body: JSONValue,
  ): Promise<Response> {
    // const { response } = await this.sendSingleMessage('rpc', {
    //   module,
    //   method,
    //   body,
    // })
    //   return new Promise((resolve) => {
    //     const requestId = this.getNextRequestId()
    //     this.requestCallbacks.set(requestId, resolve)
    //     this.worker!.postMessage({ type, payload, requestId })
    //   })
    return new Promise(async (resolve, reject) => {
      const response = await this._rpcStream<Response>(
        module,
        method,
        body,
        resolve,
        reject,
      )
    })

    // const parsed = JSON.parse(response) as StreamResult<Response>
    // if (parsed.error) {
    //   throw new Error(parsed.error)
    // }
    // return parsed.data
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

    return unsubscribe
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

    return unsubscribe
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
    this.openPromise = Promise.resolve()
    this.requestCallbacks.clear()
  }

  isOpen() {
    return this.worker !== null && this._isOpen
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

    return unsubscribe
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

    return unsubscribe
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

    return unsubscribe
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

    return unsubscribe
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
