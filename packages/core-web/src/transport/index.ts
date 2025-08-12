/**
 * Transport Layer Abstraction
 *
 * Provides a unified interface for different transport mechanisms
 * used to communicate with Fedimint backends.
 */

// Import types
import { TransportFactory, type RpcTransport } from '../rpc'
import type { BaseRpcTransport } from './base'

// Export transport factory functions
export { createWebWorkerTransport } from './web'
export { createTauriTransport } from './tauri'

// Export types
export type { RpcTransport, TransportFactory, BaseRpcTransport }
