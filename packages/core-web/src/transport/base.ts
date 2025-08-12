import type { RpcRequestFull, RpcResponseFull } from '../types'

/**
 * Base interface for all RPC transports
 * This is the interface that core-web expects
 */
export interface RpcTransport {
  /**
   * Send an RPC request
   * @param request The RPC request to send
   */
  sendRequest(request: RpcRequestFull): void

  /**
   * Clean up resources when the transport is no longer needed
   */
  destroy(): void
}

/**
 * Factory type for creating transport instances
 */
export type TransportFactory = (
  onRpcResponse: (response: RpcResponseFull) => void,
) => Promise<RpcTransport>

/**
 * Base abstract class for implementing RPC transports
 * Provides common functionality for transport implementations
 */
export abstract class BaseRpcTransport implements RpcTransport {
  protected listeners: Map<number, (response: RpcResponseFull) => void> =
    new Map()
  protected initialized: boolean = false
  protected onRpcResponse: (response: RpcResponseFull) => void

  constructor(onRpcResponse: (response: RpcResponseFull) => void) {
    this.onRpcResponse = onRpcResponse
  }

  /**
   * Initialize the transport
   * Must be implemented by transport-specific classes
   */
  abstract initialize(): Promise<void>

  /**
   * Implementation of the RpcTransport interface
   * Send a request using the transport
   */
  abstract sendRequest(request: RpcRequestFull): void

  /**
   * Implementation of the RpcTransport interface
   * Cleanup the transport
   */
  destroy(): void {
    this.listeners.clear()
    this.initialized = false
  }

  /**
   * Helper method to send an RPC response through the callback
   */
  protected sendResponse(
    requestId: number,
    responseType: 'data' | 'error' | 'aborted' | 'end' | 'log',
    result?: unknown,
    error?: string,
  ): void {
    const response: RpcResponseFull = {
      request_id: requestId,
      type: responseType,
      ...(responseType === 'data' && { data: result }),
      ...(responseType === 'error' && { error: error || 'Unknown error' }),
      ...(responseType === 'log' && {
        message: error || 'Log message',
        level: (result as string) || 'info',
        data: {},
      }),
    } as RpcResponseFull

    this.onRpcResponse(response)
  }
}
