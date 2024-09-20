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
} from './types/wallet'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private openPromise: Promise<void> | null = null
  private resolveOpen: () => void = () => {}
  private _isOpen: boolean = false
  private requestCounter: number = 0
  private requestCallbacks: Map<number, (value: any) => void> = new Map()

  /**
   * Creates a new instance of FedimintWallet.
   *
   * @description
   * This constructor initializes a FedimintWallet instance, which manages communication
   * with a Web Worker. The Web Worker is responsible for running WebAssembly code that
   * handles the core Fedimint Client operations.
   *
   * (default) When not in lazy mode, the constructor immediately initializes the
   * Web Worker and begins loading the WebAssembly module in the background. This
   * allows for faster subsequent operations but may increase initial load time.
   *
   * In lazy mode, the Web Worker and WebAssembly initialization are deferred until
   * the first operation that requires them, reducing initial overhead at the cost
   * of a slight delay on the first operation.
   *
   * @param {boolean} lazy - If true, delays Web Worker and WebAssembly initialization
   *                         until needed. Default is false.
   *
   * @example
   * // Create a wallet with immediate initialization
   * const wallet = new FedimintWallet();
   * wallet.open();
   *
   * // Create a wallet with lazy initialization
   * const lazyWallet = new FedimintWallet(true);
   * // Some time later...
   * wallet.initialize();
   * wallet.open();
   */
  constructor(lazy: boolean = false) {
    this.openPromise = new Promise((resolve) => {
      this.resolveOpen = resolve
    })
    if (lazy) return
    this.initialize()
  }

  async waitForOpen() {
    if (this._isOpen) return Promise.resolve()
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
        if (data.data) resolve(data.data)
        else if (data.error) reject(data.error)
      })
      try {
        this.worker!.postMessage({ type, payload, requestId })
      } catch (e) {
        reject(e)
      }
    })
  }

  // Setup
  initialize() {
    if (this.initPromise) return this.initPromise
    this.worker = new Worker(new URL('worker.js', import.meta.url), {
      type: 'module',
    })
    this.worker.onmessage = this.handleWorkerMessage.bind(this)
    // TODO: HANDLE RETURNED INIT
    this.initPromise = this.sendSingleMessage('init')
    return this.initPromise
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, requestId, ...data } = event.data
    const streamCallback = this.requestCallbacks.get(requestId)
    // TODO: Handle errors... maybe have another callbacks list for errors?
    if (streamCallback) {
      streamCallback(data) // {data: something} OR {error: something}
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
        'The FedimintWallet is already open. You can only call `FedimintWallet.joinFederation` on closed clients.',
      )
    const response = await this.sendSingleMessage('join', {
      inviteCode,
      clientName,
    })
    if (response.success) {
      this._isOpen = true
      this.resolveOpen()
    }
  }

  /**
   * @summary Initiates an RPC stream with the specified module and method.
   *
   * @description
   * This function sets up an RPC stream by sending a request to a worker and
   * handling responses asynchronously. It ensures that unsubscription is handled
   * correctly, even if the unsubscribe function is called before the subscription
   * is fully established, by deferring the unsubscription attempt using `setTimeout`.
   *
   * The function operates in a non-blocking manner, leveraging Promises to manage
   * asynchronous operations and callbacks to handle responses.
   *
   *
   * @template Response - The expected type of the successful response.
   * @template Body - The type of the request body.
   * @param module - The module kind to interact with.
   * @param method - The method name to invoke on the module.
   * @param body - The request payload.
   * @param onSuccess - Callback invoked with the response data on success.
   * @param onError - Callback invoked with error information if an error occurs.
   * @param onEnd - Optional callback invoked when the stream ends.
   * @returns A function that can be called to cancel the subscription.
   *
   */
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

    let unsubscribe: (value: void) => void = () => {}
    let isSubscribed = false

    const unsubscribePromise = new Promise<void>((resolve) => {
      unsubscribe = () => {
        if (isSubscribed) {
          // If already subscribed, resolve immediately to trigger unsubscription
          resolve()
        } else {
          // If not yet subscribed, defer the unsubscribe attempt to the next event loop tick
          // This ensures that subscription setup has time to complete
          setTimeout(() => unsubscribe(), 0)
        }
      }
    })

    // Initiate the inner RPC stream setup asynchronously
    this._rpcStreamInner(
      requestId,
      module,
      method,
      body,
      onSuccess,
      onError,
      onEnd,
      unsubscribePromise,
    ).then(() => {
      isSubscribed = true
    })

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
    unsubscribePromise: Promise<void>,
    // Unsubscribe function
  ): Promise<void> {
    await this.openPromise
    if (!this.worker || !this._isOpen)
      throw new Error('FedimintWallet is not open')

    this.requestCallbacks.set(requestId, (response: StreamResult<Response>) => {
      if (response.error !== undefined) {
        onError(response.error)
      } else if (response.data !== undefined) {
        onSuccess(response.data)
      } else if (response.end !== undefined) {
        this.requestCallbacks.delete(requestId)
        onEnd()
      }
    })
    this.worker.postMessage({
      type: 'rpc',
      payload: { module, method, body },
      requestId,
    })

    unsubscribePromise.then(() => {
      this.worker?.postMessage({
        type: 'unsubscribe',
        requestId,
      })
      this.requestCallbacks.delete(requestId)
    })
  }

  private _rpcSingle<Response extends JSONValue = JSONValue>(
    module: ModuleKind,
    method: string,
    body: JSONValue,
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      this._rpcStream<Response>(module, method, body, resolve, reject)
    })
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
      onSuccess,
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
    this.openPromise = null
    this.initPromise = null
    this.requestCallbacks.clear()
    this._isOpen = false
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
      gateway: gateway.info,
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

  async updateGatewayCache(): Promise<JSONValue> {
    return await this._rpcSingle('ln', 'update_gateway_cache', {})
  }
}
