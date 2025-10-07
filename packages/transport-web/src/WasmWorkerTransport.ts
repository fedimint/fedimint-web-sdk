import type { TransportLogger, TransportRequest } from '@fedimint/types'
import { Transport } from '@fedimint/types'

export class WasmWorkerTransport extends Transport {
  private readonly worker: Worker

  logger: TransportLogger = console

  constructor() {
    super()
    this.worker = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module',
    })
    this.worker.onmessage = (event: MessageEvent) => {
      this.messageHandler(event.data)
    }
    this.worker.onerror = (event: ErrorEvent) => {
      this.errorHandler(event)
    }
  }

  postMessage(message: TransportRequest) {
    this.worker.postMessage(message)
  }
}
