import { WorkerClient } from './worker/WorkerClient'
import { logger, type LogLevel } from './utils/logger'

export abstract class Base {
  protected client: WorkerClient

  private _openPromise: Promise<void> | null = null
  private _resolveOpen: () => void = () => {}
  private _isOpen: boolean = false

  constructor(client?: WorkerClient, lazy: boolean = false) {
    this._openPromise = new Promise((resolve) => {
      this._resolveOpen = resolve
    })

    if (client) {
      this.client = client
      logger.info(
        `${this.constructor.name} instantiated with provided WorkerClient`,
      )
    } else {
      this.client = new WorkerClient()
      logger.info(`${this.constructor.name} instantiated with new WorkerClient`)
    }

    if (!lazy) {
      this.initialize()
    }
  }

  async initialize() {
    logger.info('Initializing WorkerClient')
    await this.client.initialize()
    logger.info('WorkerClient initialized')
  }

  async waitForOpen() {
    if (this._isOpen) return Promise.resolve()
    return this._openPromise
  }

  isOpen() {
    return this._isOpen
  }

  protected setOpen(isOpen: boolean) {
    this._isOpen = isOpen
    if (isOpen) {
      this._resolveOpen()
    }
  }

  async open(clientName: string) {
    await this.initialize()
    if (this.isOpen()) throw new Error('already open.')
    const { success } = await this.client.sendSingleMessage('open', {
      clientName,
    })
    if (success) {
      this.setOpen(true)
    }
    return success
  }

  async joinFederation(inviteCode: string, clientName: string) {
    await this.initialize()
    if (this.isOpen())
      throw new Error(
        'already open. You can only call `joinFederation` on closed clients.',
      )
    const response = await this.client.sendSingleMessage('join', {
      inviteCode,
      clientName,
    })
    if (response.success) {
      this.setOpen(true)
    }
  }

  /**
   * This should ONLY be called when UNLOADING the client.
   * After this call, the instance should be discarded.
   */
  async cleanup() {
    this._openPromise = null
    this._isOpen = false
    this.client.cleanup()
  }

  /**
   * Sets the log level for the library.
   * @param level The desired log level ('DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE').
   */
  setLogLevel(level: LogLevel) {
    logger.setLevel(level)
    logger.info(`Log level set to ${level}.`)
  }
}
