import type { RpcResponseFull, RpcRequestFull } from '../types'
import { logger } from '../utils/logger'
import type { RpcTransport, RpcTransportInit } from '../rpc'

class WebWorkerTransport implements RpcTransport {
  constructor(private worker: Worker) {}

  sendRequest(request: RpcRequestFull): void {
    this.worker.postMessage(request)
  }

  destroy(): void {
    this.worker.terminate()
  }
}

export class WebWorkerTransportInit implements RpcTransportInit {
  async init(
    onRpcResponse: (response: RpcResponseFull) => void,
  ): Promise<RpcTransport> {
    const worker = new Worker(new URL('../worker.js', import.meta.url), {
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
      })
    })

    worker.onmessage = (event: MessageEvent) => {
      onRpcResponse(event.data as RpcResponseFull)
    }
    return new WebWorkerTransport(worker)
  }
}
