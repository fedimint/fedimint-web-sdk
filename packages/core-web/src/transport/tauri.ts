// We use dynamic imports for Tauri APIs to make them optional
// This allows the package to be used in non-Tauri environments
import type { RpcRequestFull } from '../types'
import { logger } from '../utils/logger'
import {
  BaseRpcTransport,
  type RpcTransport,
  type TransportFactory,
} from './base'

// Define types for Tauri API functions we'll use
type InvokeFunction = (
  cmd: string,
  args?: Record<string, unknown>,
) => Promise<unknown>
type ListenFunction = (
  event: string,
  callback: (event: any) => void,
) => Promise<() => void>

/**
 * Verifies that the code is running in a Tauri environment
 * @throws Error if not in a Tauri environment
 */
function verifyTauriEnvironment(): void {
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    throw new Error(
      'Not running in a Tauri environment. This functionality requires Tauri.',
    )
  }
}

/**
 * Tauri-specific RPC transport implementation
 * This class handles RPC communication with the Rust backend in Tauri
 */
export class TauriTransport extends BaseRpcTransport implements RpcTransport {
  private eventUnlisteners: (() => void)[] = []
  private tauriInvoke: InvokeFunction
  private tauriListen: ListenFunction

  /**
   * Constructor for TauriTransport
   * @param onRpcResponse The callback to handle RPC responses
   * @param tauriInvoke The Tauri invoke function
   * @param tauriListen The Tauri listen function
   * @param eventUnlistener Optional event unlistener function
   */
  constructor(
    onRpcResponse: (response: any) => void,
    tauriInvoke: InvokeFunction,
    tauriListen: ListenFunction,
  ) {
    super(onRpcResponse)
    this.tauriInvoke = tauriInvoke
    this.tauriListen = tauriListen
  }

  /**
   * Initializes the RPC transport for Tauri
   */
  async initialize(): Promise<void> {
    try {
      // Verify we're running in a Tauri environment
      verifyTauriEnvironment()

      logger.info('Initializing Tauri transport...')

      // Call initialization API in Rust
      await this.tauriInvoke('initialize_fedimint_client')

      this.initialized = true
      logger.info('Tauri transport initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Tauri transport:', error)
      throw new Error(
        `Tauri transport initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Send request to the Tauri backend
   */
  sendRequest(request: RpcRequestFull): void {
    if (!this.initialized) {
      throw new Error('Transport not initialized. Call initialize() first.')
    }

    try {
      logger.debug('Sending request to Tauri backend:', request)
      this.tauriInvoke('send_fedimint_rpc', { request }).catch((error) => {
        logger.error('Failed to send request to Tauri backend:', error)
        const responseType = 'error' as const
        this.sendResponse(
          request.request_id,
          responseType,
          undefined,
          `Failed to send request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      })
    } catch (error) {
      logger.error('Exception sending request to Tauri backend:', error)
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
    // Clean up event listeners
    this.eventUnlisteners.forEach((unlisten) => {
      try {
        unlisten()
      } catch (error) {
        logger.warn('Error removing event listener:', error)
      }
    })
    this.eventUnlisteners = []

    super.destroy()
  }
}

/**
 * Factory function to create a Tauri transport
 * This checks if we're running in a Tauri environment before initializing
 */
export const createTauriTransport: TransportFactory = async (onRpcResponse) => {
  // Verify we're running in a Tauri environment
  verifyTauriEnvironment()

  // Dynamically import Tauri APIs
  let tauriInvoke: InvokeFunction
  let tauriListen: ListenFunction
  let unlistenRpcResponse: () => void

  try {
    // Import core API for invoke function
    const core = await import('@tauri-apps/api/core')
    tauriInvoke = core.invoke as InvokeFunction

    // Import event API for listen function
    const event = await import('@tauri-apps/api/event')
    tauriListen = event.listen as ListenFunction

    // Singleton listener for all RPC responses
    unlistenRpcResponse = await tauriListen(
      'fedimint-rpc-response',
      (event) => {
        const response = event.payload
        logger.debug('Received RPC response from Tauri:', response)

        if (
          response &&
          typeof response === 'object' &&
          'request_id' in response
        ) {
          onRpcResponse(response)
        } else {
          logger.warn('Invalid RPC response received from Tauri:', response)
        }
      },
    )
  } catch (error) {
    console.warn('Failed to import Tauri APIs:', error)
    throw new Error(
      `Tauri APIs not available. Please ensure @tauri-apps/api is installed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }

  // Create and initialize the transport with the event listener
  const transport = new TauriTransport(onRpcResponse, tauriInvoke, tauriListen)
  await transport.initialize()
  return transport
}
