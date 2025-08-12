import type { RpcResponseFull, RpcRequestFull } from '../types'
import { logger } from '../utils/logger'
import type { RpcTransport } from '../rpc'
import { BaseRpcTransport } from './base'

class WebWorkerTransport extends BaseRpcTransport implements RpcTransport {
  private worker: Worker

  constructor(
    worker: Worker,
    onRpcResponse: (response: RpcResponseFull) => void,
  ) {
    super(onRpcResponse)
    this.worker = worker
  }

  async initialize(): Promise<void> {
    // Already initialized in the factory function
    this.initialized = true
    return Promise.resolve()
  }

  sendRequest(request: RpcRequestFull): void {
    this.worker.postMessage(request)
  }

  destroy(): void {
    super.destroy()
    this.worker.terminate()
  }
}

export const createWebWorkerTransport = async (
  onRpcResponse: (response: RpcResponseFull) => void,
): Promise<WebWorkerTransport> => {
  const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module',
  })

  await new Promise<void>((resolve, reject) => {
    const handleInit = (event: MessageEvent) => {
      const response = event.data
      if (response.type === 'init_error') {
        reject(new Error(response.error))
      } else if (response.type === 'init_success') {
        logger.info('WebWorker instantiated')
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
    onRpcResponse(event.data as RpcResponseFull)
  }
  return new WebWorkerTransport(worker, onRpcResponse)
}
