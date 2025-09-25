import type {
  Transport,
  TransportErrorHandler,
  TransportMessageHandler,
  TransportRequest,
} from '../../types/transport'

export class WasmWorkerTransport implements Transport {
  private messageHandler: TransportMessageHandler = () => {}
  private errorHandler: TransportErrorHandler = () => {}
  private readonly worker: Worker

  constructor() {
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

  setMessageHandler(handler: TransportMessageHandler) {
    this.messageHandler = handler
  }

  setErrorHandler(handler: TransportErrorHandler) {
    this.errorHandler = handler
  }
}
