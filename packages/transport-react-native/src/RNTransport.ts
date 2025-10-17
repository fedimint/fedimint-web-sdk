import {
  Transport,
  type TransportRequest,
  type TransportLogger,
} from '@fedimint/types'
import { RpcHandler } from '@fedimint/react-native'
import { documentDirectory } from 'expo-file-system/legacy'

const FILE_URL_CLEANUP_REGEX = /^file:\/\/|\/$/g

/**
 * React Native Transport implementation
 *
 * Bridges TypeScript to native Rust via UniFFI bindings.
 */
export class RNTransport extends Transport {
  private rpcHandler: RpcHandler | null = null
  logger: TransportLogger = console

  constructor() {
    super()
  }

  postMessage(message: TransportRequest): void {
    const { type, requestId, payload } = message

    if (type === 'init') {
      this.handleInit(payload, requestId)
      return
    }

    this.sendRpc(type, payload, requestId)
  }

  private handleInit(payload: any, requestId?: number): void {
    try {
      // Allows to pass in a filename for testing
      const filename = payload?.filename || this.getWritableDbPath()
      this.rpcHandler = new RpcHandler(filename)

      this.sendInitializedResponse(filename, requestId)
    } catch (error) {
      this.sendErrorResponse(
        error,
        requestId,
        'RNTransport: failed to initialize',
      )
    }
  }

  private getWritableDbPath(): string {
    return `${documentDirectory?.replace(FILE_URL_CLEANUP_REGEX, '')}/fedimint.db`
  }

  private sendInitializedResponse(filename: string, requestId?: number): void {
    this.messageHandler({
      type: 'initialized',
      data: { filename },
      request_id: requestId,
    } as any)
  }

  private sendRpc(type: string, payload: unknown, requestId?: number): void {
    if (!this.rpcHandler) {
      this.sendNotInitializedError(requestId)
      return
    }

    const rpcRequest = this.buildRpcRequest(type, payload, requestId)
    const json = JSON.stringify(rpcRequest)

    try {
      this.rpcHandler.rpc(json, {
        onResponse: (responseJson: string) => {
          this.handleRpcResponse(responseJson)
        },
      })
    } catch (error) {
      this.sendErrorResponse(error, requestId, 'RNTransport: rpc threw')
    }
  }

  private buildRpcRequest(
    type: string,
    payload: unknown,
    requestId?: number,
  ): object {
    return Object.assign({ request_id: requestId, type }, payload)
  }

  private handleRpcResponse(responseJson: string): void {
    try {
      const msg = JSON.parse(responseJson)
      this.messageHandler(msg)
    } catch (error) {
      this.logger.error('RNTransport: failed to parse response', error)
      this.errorHandler(error)
    }
  }

  private sendNotInitializedError(requestId?: number): void {
    this.logger.error('RNTransport: rpcHandler not initialized')
    const errorMsg = {
      type: 'error',
      request_id: requestId,
      error: 'rpcHandler not initialized. Call init first.',
    }
    this.messageHandler(errorMsg as any)
  }

  private sendErrorResponse(
    error: unknown,
    requestId?: number,
    context: string = 'RNTransport error',
  ): void {
    this.logger.error(context, error)
    const errorMsg = {
      type: 'error',
      request_id: requestId,
      error: error instanceof Error ? error.message : String(error),
    }
    this.messageHandler(errorMsg as any)
  }
}
