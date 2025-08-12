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

// Store Tauri API functions
let tauriInvoke: InvokeFunction | undefined
let tauriListen: ListenFunction | undefined

// Try to import Tauri APIs
try {
  // Dynamic imports to avoid breaking in non-Tauri environments
  import('@tauri-apps/api/core')
    .then((core) => {
      tauriInvoke = core.invoke as InvokeFunction
    })
    .catch((err) => {
      console.warn('Tauri core API not available:', err)
    })

  import('@tauri-apps/api/event')
    .then((event) => {
      tauriListen = event.listen as ListenFunction
    })
    .catch((err) => {
      console.warn('Tauri event API not available:', err)
    })
} catch (error) {
  console.warn('Tauri APIs not available in this environment')
}

/**
 * Tauri-specific RPC transport implementation
 * This class handles RPC communication with the Rust backend in Tauri
 */
export class TauriTransport extends BaseRpcTransport implements RpcTransport {
  private eventUnlisteners: (() => void)[] = []

  /**
   * Initializes the RPC transport for Tauri
   */
  async initialize(): Promise<void> {
    try {
      // Check if we're running in Tauri environment
      if (typeof window !== 'undefined' && !(window as any).__TAURI__) {
        throw new Error(
          'Not running in Tauri environment. Please run with `npm run tauri dev` and use the Tauri app window, not the browser.',
        )
      }

      // Check if Tauri API is available
      if (!tauriInvoke || !tauriListen) {
        throw new Error(
          'Tauri APIs not available. Please ensure @tauri-apps/api is installed.',
        )
      }

      logger.info('Initializing Tauri transport...')

      // Set up event listener for responses
      const unlistenRpcResponse = await tauriListen(
        'fedimint-rpc-response',
        (event) => {
          const response = event.payload
          logger.debug('Received RPC response from Tauri:', response)

          if (
            response &&
            typeof response === 'object' &&
            'request_id' in response
          ) {
            this.onRpcResponse(response)
          } else {
            logger.warn('Invalid RPC response received from Tauri:', response)
          }
        },
      )

      this.eventUnlisteners.push(unlistenRpcResponse)

      // Call initialization API in Rust
      await tauriInvoke('initialize_fedimint_client')

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
    if (!this.initialized || !tauriInvoke) {
      throw new Error('Transport not initialized. Call initialize() first.')
    }

    try {
      logger.debug('Sending request to Tauri backend:', request)
      tauriInvoke('send_fedimint_rpc', { request }).catch((error) => {
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
  // Check if we're in a Tauri environment
  if (typeof window !== 'undefined' && !(window as any).__TAURI__) {
    throw new Error(
      'Not running in a Tauri environment. This transport requires Tauri.',
    )
  }

  // Create and initialize the transport
  const transport = new TauriTransport(onRpcResponse)
  await transport.initialize()
  return transport
}
