import type { RpcResponseFull, RpcRequestFull } from '../types'
import { logger } from '../utils/logger'
import {
  BaseRpcTransport,
  type RpcTransport,
  type TransportFactory,
} from './base'

/**
 * Verifies that the code is running in a web environment that supports Web Workers
 * @throws Error if Web Workers are not supported
 */
function verifyWebEnvironment(): void {
  if (typeof Worker === 'undefined') {
    throw new Error(
      'Web Workers are not supported in this environment. This functionality requires Web Worker support.',
    )
  }
}

/**
 * Web-specific RPC transport implementation using Web Workers
 * This class handles RPC communication with the WASM backend in a Web Worker
 */
export class WebWorkerTransport
  extends BaseRpcTransport
  implements RpcTransport
{
  private worker: Worker

  /**
   * Constructor for WebWorkerTransport
   * @param onRpcResponse The callback to handle RPC responses
   * @param worker The Web Worker instance
   */
  constructor(
    onRpcResponse: (response: RpcResponseFull) => void,
    worker: Worker,
  ) {
    super(onRpcResponse)
    this.worker = worker
  }

  /**
   * Initializes the RPC transport for Web
   */
  async initialize(): Promise<void> {
    // Already initialized in the factory function
    this.initialized = true
    return Promise.resolve()
  }

  /**
   * Send request to the Web Worker
   */
  sendRequest(request: RpcRequestFull): void {
    if (!this.initialized) {
      throw new Error('Transport not initialized. Call initialize() first.')
    }

    try {
      logger.debug('Sending request to Web Worker:', request)
      this.worker.postMessage(request)
    } catch (error) {
      logger.error('Exception sending request to Web Worker:', error)
      const responseType = 'error' as const
      this.sendResponse(
        request.request_id,
        responseType,
        undefined,
        `Exception sending request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Clean up resources
   */
  override destroy(): void {
    // Terminate the web worker
    try {
      this.worker.terminate()
    } catch (error) {
      logger.warn('Error terminating Web Worker:', error)
    }

    super.destroy()
  }
}

/**
 * Factory function to create a Web Worker transport
 * This checks if we're running in a Web Worker-compatible environment before initializing
 */
export const createWebWorkerTransport: TransportFactory = async (
  onRpcResponse,
) => {
  // Verify we're running in a web environment
  verifyWebEnvironment()

  let worker: Worker

  try {
    // Create the Web Worker
    worker = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module',
    })

    // Initialize the worker and wait for confirmation
    await new Promise<void>((resolve, reject) => {
      const handleInit = (event: MessageEvent) => {
        const response = event.data
        if (response.type === 'init_error') {
          reject(new Error(response.error))
        } else if (response.type === 'init_success') {
          logger.info('Web Worker initialized successfully')
          resolve()
        }
      }

      worker.onmessage = handleInit
      worker.postMessage({
        type: 'init',
        request_id: 0,
      })
    })

    worker.onmessage = (event: MessageEvent) => {
      const response = event.data
      logger.debug('Received RPC response from Web Worker:', response)

      if (
        response &&
        typeof response === 'object' &&
        'request_id' in response
      ) {
        onRpcResponse(response as RpcResponseFull)
      } else {
        logger.warn('Invalid RPC response received from Web Worker:', response)
      }
    }
  } catch (error) {
    logger.error('Failed to initialize Web Worker transport:', error)
    throw new Error(
      `Web Worker transport initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }

  // Create and initialize the transport
  const transport = new WebWorkerTransport(onRpcResponse, worker)
  await transport.initialize()
  return transport
}
