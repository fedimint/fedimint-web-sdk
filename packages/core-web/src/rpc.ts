import type {
  CancelFunction,
  JSONValue,
  ModuleKind,
  RpcRequest,
  RpcRequestFull,
  RpcResponseFull,
  ParsedInviteCode,
  PreviewFederation,
  ParsedBolt11Invoice,
} from './types'
import { logger } from './utils/logger'
import { SubscriptionManager } from './rpc/SubscriptionManager'

export interface RpcTransport {
  sendRequest(request: RpcRequestFull): void
  destroy(): void
}

export type TransportFactory = (
  onRpcResponse: (response: RpcResponseFull) => void,
) => Promise<RpcTransport>

// Handles communication with the wasm worker
export class RpcClient {
  private transport?: RpcTransport
  private createTransport: TransportFactory
  private requestCounter = 0
  private subscriptionManager: SubscriptionManager
  private initPromise?: Promise<void>

  constructor(createTransport: TransportFactory) {
    this.createTransport = createTransport
    this.subscriptionManager = new SubscriptionManager(
      this.sendCancelRequest.bind(this),
    )
  }

  private sendCancelRequest(requestId: number) {
    const cancelRequest: RpcRequestFull = {
      request_id: ++this.requestCounter,
      type: 'cancel_rpc',
      cancel_request_id: requestId,
    }
    this.transport?.sendRequest(cancelRequest)
  }

  private async initializeInner(): Promise<void> {
    this.transport = await this.createTransport(
      this.handleWorkerMessage.bind(this),
    )
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.initializeInner()
    return this.initPromise
  }

  private handleWorkerMessage = (response: RpcResponseFull) => {
    this.subscriptionManager.handleResponse(response.request_id, response)
  }

  async joinFederation(
    inviteCode: string,
    clientName: string,
    recover?: boolean,
  ) {
    console.debug('RpcClient.joinFederation: Setting clientName to', clientName)
    // Set clientName immediately before the call to ensure it's available
    const recoverFlag = recover || false
    try {
      console.log('RpcClient.joinFederation: Making RPC call')
      console.info('info: RpcClient.joinFederation: Making RPC call')
      const result = await this.internalRpcSingle({
        type: 'join_federation',
        invite_code: inviteCode,
        client_name: clientName,
        force_recover: recoverFlag,
      })
      console.debug(
        'RpcClient.joinFederation: RPC call successful, clientName is',
        clientName,
      )
      return result
    } catch (error) {
      console.debug(
        'RpcClient.joinFederation: RPC call failed, resetting clientName',
      )
      throw error
    }
  }

  async openClient(clientName: string) {
    try {
      const result = await this.internalRpcSingle({
        type: 'open_client',
        client_name: clientName,
      })
      logger.info('open client', clientName, 'result', result)
      return result
    } catch (error) {
      throw error
    }
  }

  async closeClient(clientName: string) {
    logger.info('RpcClient.openClient: 2 calling openclient on', clientName)
    await this.internalRpcSingle({
      type: 'close_client',
      client_name: clientName,
    })
  }

  private internalRpcStream<Response extends JSONValue = JSONValue>(
    request: RpcRequest,
    onData: (data: Response) => void,
    onError: (error: string) => void,
    onEnd: () => void = () => {},
  ): CancelFunction {
    const requestId = ++this.requestCounter
    logger.debug('RpcClient - rpcStream', requestId, request)

    const requestFull = {
      ...request,
      request_id: requestId,
    } satisfies RpcRequestFull

    const cancelFn = this.subscriptionManager.addSubscription(
      requestId,
      onData,
      onError,
      onEnd,
    )

    this.transport?.sendRequest(requestFull)
    return cancelFn
  }

  private internalRpcSingle<T extends JSONValue = JSONValue>(
    request: RpcRequest,
  ) {
    return new Promise<T>((resolve, reject) => {
      const unsubscribe = this.internalRpcStream<T>(
        request,
        (data) => resolve(data),
        (error) => reject(new Error(error)),
        () => {},
      )
      // No need to unsubscribe for single requests as they auto-complete
    })
  }

  rpcStream<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    module: ModuleKind,
    method: string,
    body: Body,
    onData: (data: Response) => void,
    onError: (error: string) => void,
    onEnd: () => void = () => {},
    clientName?: string, // Add optional clientName parameter
  ): CancelFunction {
    const effectiveClientName = clientName
    console.debug(
      'RpcClient.rpcStream: using clientName',
      effectiveClientName,
      'for method',
      method,
    )
    if (effectiveClientName === undefined) {
      throw new Error(
        `Wallet is not open - no clientName provided for ${module}.${method}. Make sure to call openWallet() or joinFederation() first.`,
      )
    }
    return this.internalRpcStream(
      {
        type: 'client_rpc',
        client_name: effectiveClientName,
        module,
        method,
        payload: body,
      },
      onData,
      onError,
      onEnd,
    )
  }

  rpcSingle<T extends JSONValue = JSONValue, P extends JSONValue = JSONValue>(
    module: string,
    method: string,
    payload: P,
    clientName?: string,
  ): Promise<T> {
    const effectiveClientName = clientName
    if (effectiveClientName === undefined) {
      throw new Error(
        `Wallet is not open - no clientName provided for ${module}.${method}. Make sure to call openWallet() or joinFederation() first.`,
      )
    }
    return this.internalRpcSingle<T>({
      type: 'client_rpc',
      client_name: effectiveClientName,
      module,
      method,
      payload,
    })
  }

  async parseInviteCode(inviteCode: string): Promise<ParsedInviteCode> {
    return this.internalRpcSingle<ParsedInviteCode>({
      type: 'parse_invite_code',
      invite_code: inviteCode,
    })
  }

  async previewFederation(inviteCode: string): Promise<PreviewFederation> {
    return this.internalRpcSingle<PreviewFederation>({
      type: 'preview_federation',
      invite_code: inviteCode,
    })
  }

  async parseBolt11Invoice(invoice: string): Promise<ParsedBolt11Invoice> {
    return this.internalRpcSingle<ParsedBolt11Invoice>({
      type: 'parse_bolt11_invoice',
      invoice: invoice,
    })
  }

  async generateMnemonic() {
    return this.internalRpcSingle<{ mnemonic: string[] }>({
      type: 'generate_mnemonic',
    })
  }

  async setMnemonic(words: string[]) {
    return this.internalRpcSingle<{ success: boolean }>({
      type: 'set_mnemonic',
      words: words,
    })
  }

  async getMnemonic() {
    return this.internalRpcSingle<{ mnemonic: string[] }>({
      type: 'get_mnemonic',
    })
  }

  async cleanup() {
    this.subscriptionManager.cancelAll()
    this.subscriptionManager.clear()
    this.transport?.destroy()
    this.requestCounter = 0
    this.initPromise = undefined
  }

  // For Testing
  _getRequestCounter() {
    return this.requestCounter
  }

  _getActiveSubscriptionCount() {
    return this.subscriptionManager.getActiveSubscriptionCount()
  }

  _getActiveSubscriptionIds() {
    return this.subscriptionManager.getActiveSubscriptionIds()
  }
}
