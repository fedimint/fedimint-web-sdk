import type {
  CancelFunction,
  JSONValue,
  ModuleKind,
  RpcRequest,
  RpcResponse,
  RpcRequestFull,
  RpcResponseFull,
} from './types'
import { logger } from './utils/logger'

export interface RpcTransport {
  sendRequest(request: RpcRequestFull): void
  destroy(): void
}

export interface RpcTransportInit {
  init(
    onRpcResponse: (response: RpcResponseFull) => void,
  ): Promise<RpcTransport>
}

// Handles communication with the wasm worker
// TODO: Move rpc stream management to a separate "SubscriptionManager" class
export class RpcClient {
  private transport?: RpcTransport
  private transportInit: RpcTransportInit
  private requestCounter = 0
  private requestCallbacks = new Map<number, (response: RpcResponse) => void>()
  private initPromise?: Promise<void>
  private clientName: string | undefined

  constructor(transportInit: RpcTransportInit) {
    this.transportInit = transportInit
  }

  private async initializeInner(): Promise<void> {
    this.transport = await this.transportInit.init(
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
    const callback = this.requestCallbacks.get(response.request_id)

    if (callback) {
      callback(response)
    } else {
      logger.warn(
        'RpcClient - handleWorkerMessage - received message with no callback',
        response.request_id,
        response,
      )
    }
  }

  async joinFederation(inviteCode: string, clientName: string) {
    await this.internalRpcSingle({
      type: 'join_federation',
      invite_code: inviteCode,
      client_name: clientName,
    })
  }

  async openClient(clientName: string) {
    await this.internalRpcSingle({
      type: 'open_client',
      client_name: clientName,
    })
    this.clientName = clientName
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
    let unsubscribe = () => {
      const cancelRequest: RpcRequestFull = {
        request_id: ++this.requestCounter,
        type: 'cancel_rpc',
        cancel_request_id: requestId,
      }
      this.transport?.sendRequest(cancelRequest)
    }

    const requestFull: RpcRequestFull = {
      ...request,
      request_id: requestId,
    }

    this.requestCallbacks.set(requestId, (response: RpcResponse) => {
      switch (response.type) {
        case 'data':
          onData(response.data)
          break
        case 'error':
          onError(response.error)
          break
        case 'end':
          this.requestCallbacks.delete(requestId)
          onEnd()
          break
        case 'aborted':
          this.requestCallbacks.delete(requestId)
          onEnd()
          break
      }
    })
    this.transport?.sendRequest(requestFull)
    return unsubscribe
  }

  private internalRpcSingle<T extends JSONValue = JSONValue>(
    request: RpcRequest,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.internalRpcStream(
        request,
        (data) => resolve(data as T),
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
  ): CancelFunction {
    if (this.clientName === undefined) {
      throw new Error('Wallet is not open')
    }
    return this.internalRpcStream(
      {
        type: 'client_rpc',
        client_name: this.clientName,
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
  ): Promise<T> {
    if (this.clientName === undefined) {
      throw new Error('Wallet is not open')
    }
    return this.internalRpcSingle<T>({
      type: 'client_rpc',
      client_name: this.clientName,
      module,
      method,
      payload,
    })
  }

  async cleanup() {
    this.transport?.destroy()
    this.requestCounter = 0
    this.initPromise = undefined
    this.requestCallbacks.clear()
  }

  // For Testing
  _getRequestCounter() {
    return this.requestCounter
  }
  _getRequestCallbackMap() {
    return this.requestCallbacks
  }
}
