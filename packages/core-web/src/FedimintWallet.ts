import { RpcClient } from './rpc'
import { WebWorkerTransportInit } from './worker/WorkerTransport'
import {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
  WalletService,
} from './services'
import { logger, type LogLevel } from './utils/logger'
import {
  preview_federation,
  parse_bolt11_invoice,
  parse_invite_code,
} from '@fedimint/fedimint-client-wasm-bundler'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private _client: RpcClient

  public balance: BalanceService
  public mint: MintService
  public lightning: LightningService
  public federation: FederationService
  public recovery: RecoveryService
  public wallet: WalletService

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
    this.wallet = new WalletService(this._client)

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
    // If already open with the same client name, return success
    if (this._isOpen) {
      logger.warn('Wallet is already open')
      return true
    }

    await this.initialize()

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
   * Preview a federation configuration from an invite code without joining
   * @param inviteCode - The federation invite code to preview
   * @returns Promise containing federation config and ID
   */
  async previewFederation(inviteCode: string) {
    try {
      logger.debug('Previewing federation with invite code:', inviteCode)
      const result = await preview_federation(inviteCode)
      logger.debug('Federation preview result:', result)
      return result
    } catch (error) {
      logger.error('Error previewing federation:', error)
      throw new Error(`Failed to preview federation: ${error}`)
    }
  }

  /**
   * Parses a BOLT11 invoice string into its components.
   * @param invoice - The BOLT11 invoice string to parse.
   * @returns Parsed invoice object containing details like amount, description, etc.
   */
  async parseBolt11Invoice(invoice: string) {
    try {
      logger.debug('Parsing BOLT11 invoice:', invoice)
      const result = await parse_bolt11_invoice(invoice)
      logger.debug('Parsed invoice result:', result)
      return result
    } catch (error) {
      logger.error('Error parsing BOLT11 invoice:', error)
      throw new Error(`Failed to parse BOLT11 invoice: ${error}`)
    }
  }

  /**
   * Parses an invite code into its components.
   * @param inviteCode - The invite code to parse.
   * @returns Parsed invite code object containing federation ID and other details.
   */
  async parseInviteCode(inviteCode: string) {
    try {
      logger.debug('Parsing invite code:', inviteCode)
      const result = await parse_invite_code(inviteCode)
      logger.debug('Parsed invite code result:', result)
      return result
    } catch (error) {
      logger.error('Error parsing invite code:', error)
      throw new Error(`Failed to parse invite code: ${error}`)
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

  // Debug/Testing methods
  _getActiveSubscriptionIds(): number[] {
    return this._client._getActiveSubscriptionIds()
  }

  _getActiveSubscriptionCount(): number {
    return this._client._getActiveSubscriptionCount()
  }

  _getRequestCounter(): number {
    return this._client._getRequestCounter()
  }
}
