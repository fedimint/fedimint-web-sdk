import type {
  CancelFunction,
  JSONValue,
  ModuleKind,
  StreamError,
  StreamResult,
} from '../types'
import { Logger } from '../utils/logger'
import type {
  Transport,
  TransportMessage,
  TransportMessageType,
  ParsedInviteCode,
  ParsedBolt11Invoice,
  PreviewFederation,
} from '@fedimint/types'

/**
 * Handles communication with a generic transport.
 * Must be instantiated with a platform-specific transport. (wasm for web, react native, etc.)
 */
export class TransportClient {
  // Generic Transport. Can be wasm, react native, node, etc.
  private readonly transport: Transport
  private requestCounter = 0
  private requestCallbacks = new Map<number, (value: any) => void>()
  private initPromise: Promise<boolean> | undefined = undefined
  logger: Logger

  /**
   * @summary Constructor for the TransportClient
   * @param transport - The platform-specific transport to use. (wasm for web, react native, etc.)
   */
  constructor(transport: Transport) {
    this.transport = transport
    this.logger = new Logger(transport.logger)
    this.transport.setMessageHandler(this.handleTransportMessage)
    this.transport.setErrorHandler(this.handleTransportError)
    this.logger.info('TransportClient instantiated')
    this.logger.debug('TransportClient transport', transport)
  }

  // Idempotent setup - Loads the wasm module
  initialize() {
    if (this.initPromise) return this.initPromise
    this.initPromise = this.sendUnifiedRpcRequest({ type: 'init' })
    return this.initPromise
  }

  private handleLogMessage(message: TransportMessage) {
    const { type, level, message: logMessage, ...data } = message
    this.logger.info(String(level), String(logMessage), data)
  }

  private handleTransportError = (error: unknown) => {
    this.logger.error('TransportClient error', error)
  }

  private handleTransportMessage = (message: TransportMessage) => {
    const { type, requestId, ...data } = message
    if (type === 'log') {
      this.handleLogMessage(message)
    }

    if (type === 'rpcResponse') {
      // Handle native RPC response format
      const rpcResponse = (message as any).response
      const callback =
        requestId !== undefined
          ? this.requestCallbacks.get(requestId)
          : undefined

      this.logger.debug(
        'TransportClient - rpcResponse received',
        requestId,
        rpcResponse,
      )

      if (callback && rpcResponse) {
        // Check if the response has the expected structure
        if (rpcResponse.kind) {
          // Convert RPC response kind to transport format
          const transportData = this.mapRpcResponseToTransport(rpcResponse.kind)
          callback(transportData)
        } else {
          // Response might be in a different format, let's handle it
          this.logger.debug(
            'TransportClient - unexpected response format',
            rpcResponse,
          )

          // Try to handle the response directly
          if (rpcResponse.error) {
            callback({ error: rpcResponse.error })
          } else if (rpcResponse.data !== undefined) {
            callback({ data: rpcResponse.data })
          } else {
            // If it's a successful response without explicit data/error structure
            callback({ data: rpcResponse })
          }
        }
      }
      return
    }

    const streamCallback =
      requestId !== undefined ? this.requestCallbacks.get(requestId) : undefined
    // TODO: Handle errors... maybe have another callbacks list for errors?
    this.logger.debug('TransportClient - handleTransportMessage', message)
    if (streamCallback) {
      streamCallback(data) // {data: something} OR {error: something}
    } else if (requestId !== undefined) {
      this.logger.warn(
        'TransportClient - handleTransportMessage - received message with no callback',
        requestId,
        message,
      )
    }
  }

  /**
   * Maps RPC response kinds to transport message format
   */
  private mapRpcResponseToTransport(kind: any) {
    switch (kind.type) {
      case 'data':
        return { data: kind.data }
      case 'error':
        return { error: kind.error }
      case 'aborted':
        return { aborted: true }
      case 'end':
        return { end: true }
      default:
        return { error: 'Unknown response type' }
    }
  }

  // TODO: Handle errors... maybe have another callbacks list for errors?
  // TODO: Handle timeouts
  // TODO: Handle multiple errors

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
  rpcStream<
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
    const requestId = ++this.requestCounter
    this.logger.debug(
      'TransportClient - rpcStream',
      requestId,
      module,
      method,
      body,
    )
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

    const rpcRequest = {
      type: 'client_rpc',
      module: module,
      method: method,
      payload: body,
    }

    // Initiate the inner RPC stream setup asynchronously
    this._rpcStreamInner(
      requestId,
      rpcRequest,
      onSuccess,
      onError,
      onEnd,
      unsubscribePromise,
    ).then(() => {
      isSubscribed = true
    })

    return unsubscribe
  }

  private async _rpcStreamInner<Response extends JSONValue = JSONValue>(
    requestId: number,
    rpcRequest: any,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
    onEnd: () => void = () => {},
    unsubscribePromise: Promise<void>,
    // Unsubscribe function
  ) {
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

    // Send the unified RPC request with specific type
    this.transport.postMessage({
      type: rpcRequest.type as TransportMessageType,
      payload: rpcRequest,
      requestId,
    })

    unsubscribePromise.then(() => {
      // Use the new RPC cancel method
      this.transport.postMessage({
        type: 'cancel_rpc' as TransportMessageType,
        payload: {
          type: 'cancel_rpc',
          cancel_request_id: requestId,
        },
        requestId: ++this.requestCounter,
      })
      this.requestCallbacks.delete(requestId)
    })
  }

  rpcSingle<
    Response extends JSONValue = JSONValue,
    Error extends string = string,
  >(module: ModuleKind, method: string, body: JSONValue) {
    this.logger.debug('TransportClient - rpcSingle', module, method, body)
    const rpcRequest = {
      type: 'client_rpc',
      module: module,
      method: method,
      payload: body,
    }
    return this.sendUnifiedRpcRequest<Response>(rpcRequest)
  }

  // New RPC methods for the updated architecture - using existing transport infrastructure

  /**
   * Send a direct RPC request
   */
  async sendUnifiedRpcRequest<T = JSONValue>(kind: any): Promise<T> {
    const requestId = ++this.requestCounter

    // Debug: Log what we're sending
    this.logger.debug(
      'TransportClient - sendUnifiedRpcRequest',
      requestId,
      kind,
    )

    return new Promise<T>((resolve, reject) => {
      this.requestCallbacks.set(requestId, (response: any) => {
        this.requestCallbacks.delete(requestId)

        if (response.error) {
          reject(new Error(response.error))
        } else if (response.data !== undefined) {
          resolve(response.data)
        } else {
          reject(new Error('Invalid response format'))
        }
      })

      // Use the specific RPC type directly
      this.transport.postMessage({
        type: kind.type as TransportMessageType,
        payload: kind,
        requestId,
      })
    })
  }

  /**
   * Set mnemonic words for the wallet
   */
  async setMnemonic(words: string[]): Promise<{ success: boolean }> {
    return this.sendUnifiedRpcRequest({
      type: 'set_mnemonic',
      words,
    })
  }

  /**
   * Generate a new mnemonic
   */
  async generateMnemonic(): Promise<{ mnemonic: string[] }> {
    return this.sendUnifiedRpcRequest({
      type: 'generate_mnemonic',
    })
  }

  /**
   * Get the current mnemonic
   */
  async getMnemonic(): Promise<{ mnemonic: string[] }> {
    return this.sendUnifiedRpcRequest({
      type: 'get_mnemonic',
    })
  }

  /**
   * Join a federation
   */
  async joinFederation(
    inviteCode: string,
    clientName: string,
    forceRecover: boolean = false,
  ): Promise<void> {
    await this.sendUnifiedRpcRequest({
      type: 'join_federation',
      invite_code: inviteCode,
      force_recover: forceRecover,
      client_name: clientName,
    })
  }

  /**
   * Open a client
   */
  async openClient(clientName: string): Promise<void> {
    await this.sendUnifiedRpcRequest({
      type: 'open_client',
      client_name: clientName,
    })
  }

  /**
   * Close a client
   */
  async closeClient(clientName: string): Promise<void> {
    await this.sendUnifiedRpcRequest({
      type: 'close_client',
      client_name: clientName,
    })
  }

  /**
   * Parse an invite code
   */
  async parseInviteCode(inviteCode: string): Promise<ParsedInviteCode> {
    return this.sendUnifiedRpcRequest({
      type: 'parse_invite_code',
      invite_code: inviteCode,
    })
  }

  /**
   * Parse a Bolt11 invoice
   */
  async parseBolt11Invoice(invoice: string): Promise<ParsedBolt11Invoice> {
    return this.sendUnifiedRpcRequest({
      type: 'parse_bolt11_invoice',
      invoice,
    })
  }

  /**
   * Preview federation information
   */
  async previewFederation(inviteCode: string): Promise<PreviewFederation> {
    return this.sendUnifiedRpcRequest({
      type: 'preview_federation',
      invite_code: inviteCode,
    })
  }

  async cleanup() {
    await this.sendUnifiedRpcRequest({ type: 'cleanup' })
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
