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
  // Won't have this as a instance variable
  private clientName: string | undefined

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

  async joinFederation(inviteCode: string, clientName: string) {
    console.debug('RpcClient.joinFederation: Setting clientName to', clientName)
    // Set clientName immediately before the call to ensure it's available
    this.clientName = clientName
    try {
      console.log('RpcClient.joinFederation: Making RPC call')
      console.info('info: RpcClient.joinFederation: Making RPC call')
      const result = await this.internalRpcSingle({
        type: 'join_federation',
        invite_code: inviteCode,
        client_name: clientName,
      })
      console.debug(
        'RpcClient.joinFederation: RPC call successful, clientName is',
        this.clientName,
      )
      return result
    } catch (error) {
      console.debug(
        'RpcClient.joinFederation: RPC call failed, resetting clientName',
      )
      // Reset clientName if the operation failed
      this.clientName = undefined
      throw error
    }
  }

  async openClient(clientName: string) {
    // Set clientName immediately before the call
    this.clientName = clientName
    try {
      const result = await this.internalRpcSingle({
        type: 'open_client',
        client_name: clientName,
      })
      return result
    } catch (error) {
      // Reset clientName if the operation failed
      this.clientName = undefined
      throw error
    }
  }

  async closeClient(clientName: string) {
    await this.internalRpcSingle({
      type: 'close_client',
      client_name: clientName,
    })
    this.clientName = undefined
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
    const effectiveClientName = clientName || this.clientName
    console.debug(
      'RpcClient.rpcStream: using clientName',
      effectiveClientName,
      'for method',
      method,
    )
    if (effectiveClientName === undefined) {
      throw new Error('Wallet is not open')
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
    clientName?: string, // Add optional clientName parameter
  ): Promise<T> {
    const effectiveClientName = clientName || this.clientName
    if (effectiveClientName === undefined) {
      throw new Error('Wallet is not open')
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
