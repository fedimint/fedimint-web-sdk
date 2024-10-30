import { RpcClient } from './rpc'
import { WebWorkerTransportInit } from './worker/WorkerTransport'
import {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
} from './services'
import { logger, type LogLevel } from './utils/logger'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private _client: RpcClient

  public balance: BalanceService
  public mint: MintService
  public lightning: LightningService
  public federation: FederationService
  public recovery: RecoveryService

  private _openPromise: Promise<void> | undefined = undefined
  private _resolveOpen: () => void = () => {}
  private _isOpen: boolean = false

  /**
   * Creates a new instance of FedimintWallet.
   *
   * This constructor initializes a FedimintWallet instance, which manages communication
   * with a Web Worker. The Web Worker is responsible for running WebAssembly code that
   * handles the core Fedimint Client operations.
   *
   * (default) When not in lazy mode, the constructor immediately initializes the
   * Web Worker and begins loading the WebAssembly module in the background. This
   * allows for faster subsequent operations but may increase initial load time.
   *
   * In lazy mode, the Web Worker and WebAssembly initialization are deferred until
   * the first operation that requires them, reducing initial overhead at the cost
   * of a slight delay on the first operation.
   *
   * @param {boolean} lazy - If true, delays Web Worker and WebAssembly initialization
   *                         until needed. Default is false.
   *
   * @example
   * // Create a wallet with immediate initialization
   * const wallet = new FedimintWallet();
   * wallet.open();
   *
   * // Create a wallet with lazy initialization
   * const lazyWallet = new FedimintWallet(true);
   * // Some time later...
   * lazyWallet.initialize();
   * lazyWallet.open();
   */
  constructor(lazy: boolean = false) {
    this._openPromise = new Promise((resolve) => {
      this._resolveOpen = resolve
    })
    this._client = new RpcClient(new WebWorkerTransportInit())
    this.mint = new MintService(this._client)
    this.lightning = new LightningService(this._client)
    this.balance = new BalanceService(this._client)
    this.federation = new FederationService(this._client)
    this.recovery = new RecoveryService(this._client)

    logger.info('FedimintWallet instantiated')

    if (!lazy) {
      this.initialize()
    }
  }

  async initialize() {
    logger.info('Initializing RpcClient')
    await this._client.initialize()
    logger.info('RpcClient initialized')
  }

  async waitForOpen() {
    if (this._isOpen) return Promise.resolve()
    return this._openPromise
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    await this._client.initialize()
    // TODO: Determine if this should be safe or throw
    if (this._isOpen) throw new Error('The FedimintWallet is already open.')
    try {
      await this._client.openClient(clientName)
      this._isOpen = true
      this._resolveOpen()
      return true
    } catch (e) {
      logger.error('Error opening client', e)
      return false
    }
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this._client.initialize()
    // TODO: Determine if this should be safe or throw
    if (this._isOpen)
      throw new Error(
        'The FedimintWallet is already open. You can only call `joinFederation` on closed clients.',
      )
    try {
      await this._client.joinFederation(inviteCode, clientName)
      this._isOpen = true
      this._resolveOpen()
      return true
    } catch (e) {
      logger.error('Error joining federation', e)
      return false
    }
  }

  /**
   * This should ONLY be called when UNLOADING the wallet client.
   * After this call, the FedimintWallet instance should be discarded.
   */
  async cleanup() {
    this._openPromise = undefined
    this._isOpen = false
    await this._client.cleanup()
  }

  isOpen() {
    return this._isOpen
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
